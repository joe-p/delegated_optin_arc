/* eslint-disable no-plusplus */
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import {
  describe, beforeEach, it, expect,
} from '@jest/globals';
import { readFileSync } from 'fs';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { DelegatedOptInClient } from '../delegated_optin_client';

const SUPPRESS_LOG = { sendParams: { suppressLog: true } };
const BOX_MBR = 40_900;

/**
 * ConcatArrays takes n number arrays and returns a joint Uint8Array
 * @param arrs - An arbitrary number of n array-like number list arguments
 * @returns [a,b]
 */
export function concatArrays(...arrs: ArrayLike<number>[]) {
  const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
  const c = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    c.set(arrs[i], offset);
    offset += arrs[i].length;
  }

  return c;
}

async function createASA(algod: algosdk.Algodv2, sender: algosdk.Account): Promise<number> {
  const atc = new algosdk.AtomicTransactionComposer();

  const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams: await algod.getTransactionParams().do(),
    from: sender.addr,
    total: 1,
    decimals: 0,
    defaultFrozen: false,
  });

  atc.addTransaction({
    txn: assetCreateTxn,
    signer: algosdk.makeBasicAccountTransactionSigner(sender),
  });

  await atc.execute(algod, 3);

  return (await algod.pendingTransactionInformation(assetCreateTxn.txID()).do())['asset-index'];
}

const OPEN_OPTIN_TEAL = readFileSync('./contracts/open_optin_lsig.teal').toString();

async function generateOptInLsig(
  algod: algosdk.Algodv2,
  appId: number,
): Promise<algosdk.LogicSigAccount> {
  const teal = OPEN_OPTIN_TEAL.replace('TMPL_DELEGATED_OPTIN_APP_ID', appId.toString());

  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(
    Buffer.from(compiledTeal.result, 'base64'),
  );
}

async function setSignature(
  algod: algosdk.Algodv2,
  appId: number,
  receiver: algosdk.Account,
  app: DelegatedOptInClient,
  optInLsig: algosdk.LogicSigAccount,
) {
  const boxMBRPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: receiver.addr,
    to: algosdk.getApplicationAddress(appId),
    amount: BOX_MBR,
    suggestedParams: await algod.getTransactionParams().do(),
  });

  const suggestedParams = await algod.getTransactionParams().do();
  const signer = algosdk.makeBasicAccountTransactionSigner(receiver);
  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    appID: appId,
    method: app.appClient.getABIMethod('setSignature')!,
    methodArgs: [optInLsig.lsig.sig!, {
      txn: boxMBRPayment,
      signer,
    }],
    sender: receiver.addr,
    signer,
    suggestedParams,
    boxes: [{ appIndex: 0, name: algosdk.decodeAddress(receiver.addr).publicKey }],
  });

  await atc.execute(algod, 3);
}

async function delegatedOptIn(
  {
    senderAddr, senderSigner, asa, algod, receiverAddr, app, lsig, appID,
  }: { senderAddr: string; senderSigner: algosdk.TransactionSigner; asa: number; algod: algosdk.Algodv2; type: 'open' | 'address'; receiverAddr: string; app: DelegatedOptInClient; lsig: algosdk.LogicSigAccount, appID: number},
) {
  const sp = await algod.getTransactionParams().do();

  const pay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddr,
    to: receiverAddr,
    amount: 200_000,
    suggestedParams: { ...sp, fee: 2_000, flatFee: true },
  });

  const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: receiverAddr,
    to: receiverAddr,
    assetIndex: asa,
    amount: 0,
    suggestedParams: { ...sp, fee: 0, flatFee: true },
  });

  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    appID,
    method: app.appClient.getABIMethod('delegatedOptIn')!,
    methodArgs: [
      { txn: pay, signer: senderSigner },
      { txn: optIn, signer: algosdk.makeLogicSigAccountTransactionSigner(lsig) },
    ],
    suggestedParams: sp,
    sender: senderAddr,
    signer: senderSigner,
    boxes: [{ appIndex: 0, name: algosdk.decodeAddress(receiverAddr).publicKey }],
  });

  await atc.execute(algod, 3);
}

describe('Delegated Opt In App', () => {
  const fixture = algorandFixture();
  let app: DelegatedOptInClient;
  let appId: number;

  beforeEach(fixture.beforeEach, 10_000);

  describe('create', () => {
    it('creates the app', async () => {
      app = new DelegatedOptInClient({
        sender: fixture.context.testAccount,
        resolveBy: 'id',
        id: 0,
      }, fixture.context.algod);

      await app.create.bare(SUPPRESS_LOG);

      await app.appClient.fundAppAccount({ amount: algokit.microAlgos(100_000), ...SUPPRESS_LOG });

      appId = Number((await app.appClient.getAppReference()).appId);
    });
  });

  describe('setSignature', () => {
    it('works with valid signature and lsig', async () => {
      const { algod, testAccount } = fixture.context;

      const optInLsig = await generateOptInLsig(algod, appId);

      optInLsig.sign(testAccount.sk);

      await setSignature(algod, appId, testAccount, app, optInLsig);

      const boxValue = await app.appClient.getBoxValue(
        algosdk.decodeAddress(testAccount.addr).publicKey,
      );

      expect(boxValue).toEqual(optInLsig.lsig.sig);
    });
  });

  describe('delegatedOptIn', () => {
    it('works with valid lsig and method call', async () => {
      const { testAccount, algod, kmd } = fixture.context;

      const sender = algosdk.generateAccount();

      await algokit.ensureFunded({
        accountToFund: sender.addr,
        minSpendingBalance: algokit.microAlgos(304_000),
        suppressLog: true,
      }, algod, kmd);

      const asa = await createASA(algod, sender);

      await expect(algod.accountAssetInformation(testAccount.addr, asa).do())
        .rejects.toThrowError('account asset info not found');

      const lsig = await generateOptInLsig(algod, appId);
      lsig.sign(testAccount.sk);

      await setSignature(algod, appId, testAccount, app, lsig);

      await delegatedOptIn({
        senderAddr: sender.addr,
        senderSigner: algosdk.makeBasicAccountTransactionSigner(sender),
        asa,
        algod,
        type: 'open',
        receiverAddr: testAccount.addr,
        app,
        lsig,
        appID: appId,
      });

      expect((await algod.accountAssetInformation(testAccount.addr, asa).do())['asset-holding'].amount).toBe(0);
    });
  });

  describe('revokeSignature', () => {
    it('sends back MBR', async () => {
      const { algod, testAccount } = fixture.context;

      const optInLsig = await generateOptInLsig(algod, appId);

      optInLsig.sign(testAccount.sk);

      const boxRef = algosdk.decodeAddress(testAccount.addr).publicKey;

      await setSignature(algod, appId, testAccount, app, optInLsig);
      const preBalance = (await algod.accountInformation(testAccount.addr).do()).amount;

      await app.revokeSignature({ }, {
        ...SUPPRESS_LOG,
        sender: testAccount,
        boxes: [boxRef],
        sendParams: { fee: algokit.microAlgos(2_000) },
      });

      expect(app.appClient.getBoxValue(boxRef)).rejects.toThrowError('box not found');

      const postBalance = (await algod.accountInformation(testAccount.addr).do()).amount;

      expect(postBalance - preBalance).toBe(BOX_MBR - 2_000);
    });

    it("doesn't allow opt-ins", async () => {
      const { testAccount, algod, kmd } = fixture.context;

      const sender = algosdk.generateAccount();

      await algokit.ensureFunded({
        accountToFund: sender.addr,
        minSpendingBalance: algokit.microAlgos(304_000),
        suppressLog: true,
      }, algod, kmd);

      const asa = await createASA(algod, sender);

      await expect(algod.accountAssetInformation(testAccount.addr, asa).do())
        .rejects.toThrowError('account asset info not found');

      const lsig = await generateOptInLsig(algod, appId);
      lsig.sign(testAccount.sk);

      expect(delegatedOptIn({
        senderAddr: sender.addr,
        senderSigner: algosdk.makeBasicAccountTransactionSigner(sender),
        asa,
        algod,
        type: 'open',
        receiverAddr: testAccount.addr,
        app,
        lsig,
        appID: appId,
      })).rejects.toThrow('Details: pc=110, opcodes=swap; pop; assert');
    });
  });
});
