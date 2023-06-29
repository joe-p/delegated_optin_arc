/* eslint-disable no-plusplus */
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import {
  describe, beforeEach, test, expect, beforeAll,
} from '@jest/globals';
import { readFileSync } from 'fs';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import sha256 from 'sha256';
import { MasterClient } from '../master_client';

let master: MasterClient;
let compiledVerifierTeal: {hash: string, result: string};
let compiledOptInTeal: {hash: string, result: string};
let compiledAddressSpecificOptInTeal: {hash: string, result: string};
let receiver: algosdk.Account;

const SUPPRESS_LOG = { sendParams: { suppressLog: true } };

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

async function delegatedOptIn(testAccount: algosdk.Account, asa: number, algod: algosdk.Algodv2) {
  const optInLsig = new algosdk.LogicSigAccount(
    Buffer.from(compiledOptInTeal.result, 'base64'),
  );

  optInLsig.sign(receiver.sk);

  const sp = await algod.getTransactionParams().do();

  const pay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: testAccount.addr,
    to: receiver.addr,
    amount: 200_000,
    suggestedParams: { ...sp, fee: 2_000, flatFee: true },
  });

  const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: receiver.addr,
    to: receiver.addr,
    assetIndex: asa,
    amount: 0,
    suggestedParams: { ...sp, fee: 0, flatFee: true },
  });

  const prefix = Buffer.from('e-');
  const key = algosdk.decodeAddress(receiver.addr).publicKey;
  const boxRef = concatArrays(prefix, key);

  await master.verify(
    {
      mbrPayment: {
        txn: pay,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        signer: algosdk.makeBasicAccountTransactionSigner(testAccount),
      },
      optIn: {
        txn: optIn,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        signer: algosdk.makeLogicSigAccountTransactionSigner(optInLsig),
      },
    },
    {
      boxes: [boxRef],
      ...SUPPRESS_LOG,
    },
  );
}

async function setEndTime(time: number) {
  const prefix = Buffer.from('e-');
  const key = algosdk.decodeAddress(receiver.addr).publicKey;
  const boxRef = concatArrays(prefix, key);

  await master.setEndTime(
    {
      timestamp: BigInt(time),
    },
    {
      boxes: [boxRef],
      sender: receiver,
      ...SUPPRESS_LOG,
    },
  );
}

describe('Master Contract', () => {
  const fixture = algorandFixture();

  beforeAll(() => {
    receiver = algosdk.generateAccount();
  });

  beforeEach(fixture.beforeEach, 10_000);

  test('Create', async () => {
    const { algod } = fixture.context;

    master = new MasterClient({
      sender: fixture.context.testAccount,
      resolveBy: 'id',
      id: 0,
    }, fixture.context.algod);

    await master.create.bare(SUPPRESS_LOG);

    const { appId } = await master.appClient.getAppReference();

    const optInLsigTeal = readFileSync('./contracts/optin_lsig.teal')
      .toString()
      .replace('TMPL_MASTER_APP', appId.toString());

    compiledOptInTeal = await algod.compile(optInLsigTeal).do();

    const optInLsig = new algosdk.LogicSig(
      Buffer.from(compiledOptInTeal.result, 'base64'),
    );

    const toBeSigned = concatArrays(optInLsig.tag, optInLsig.logic);

    const verifierLsigTeal = readFileSync('./contracts/verifier.teal')
      .toString()
      .replace('TMPL_TO_BE_SIGNED', `0x${Buffer.from(toBeSigned).toString('hex')}`);

    compiledVerifierTeal = await algod.compile(verifierLsigTeal).do();
  });

  test('setSigVerificationAddress', async () => {
    await master.setSigVerificationAddress(
      {
        lsig: compiledVerifierTeal.hash,
      },
      SUPPRESS_LOG,
    );
  });

  test('setSignature', async () => {
    const { algod } = fixture.context;

    const optInLsig = new algosdk.LogicSig(
      Buffer.from(compiledOptInTeal.result, 'base64'),
    );

    optInLsig.sign(receiver.sk);

    const verifierBytes = Buffer.from(compiledVerifierTeal.result, 'base64');

    const verifierAcct = new algosdk.LogicSigAccount(verifierBytes);

    const verifierTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: { ...(await algod.getTransactionParams().do()), fee: 0, flatFee: true },
      from: verifierAcct.address(),
      to: verifierAcct.address(),
      amount: 0,
    });

    const prefix = Buffer.from('s-');
    const key = algosdk.decodeAddress(receiver.addr).publicKey;
    const boxRef = concatArrays(prefix, key);

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(141700), ...SUPPRESS_LOG });

    await master.setSignature(
      {
        sig: optInLsig.sig!,
        signer: receiver.addr,
        verifier: {
          txn: verifierTxn,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          signer: algosdk.makeLogicSigAccountTransactionSigner(verifierAcct),
        },
      },
      {
        boxes: [boxRef],
        sendParams: { suppressLog: true, fee: algokit.microAlgos(2_000) },
      },
    );

    const boxValue = await master.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(optInLsig.sig);
  });

  test('verify', async () => {
    const { testAccount, algod } = fixture.context;

    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do()).rejects.toThrowError('account asset info not found');

    await delegatedOptIn(testAccount, asa, algod);

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setEndTime - 0xffffffff', async () => {
    const { testAccount, algod } = fixture.context;

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do()).rejects.toThrowError('account asset info not found');

    await algokit.ensureFunded(
      {
        accountToFund: receiver.addr,
        minSpendingBalance: algokit.microAlgos(100_000),
        suppressLog: true,
      },
      algod,
      fixture.context.kmd,
    );

    await setEndTime(0xffffffff);
    await delegatedOptIn(testAccount, asa, algod);

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setEndTime - 0', async () => {
    const { testAccount, algod } = fixture.context;

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do()).rejects.toThrowError('account asset info not found');

    await algokit.ensureFunded(
      {
        accountToFund: receiver.addr,
        minSpendingBalance: algokit.microAlgos(100_000),
        suppressLog: true,
      },
      algod,
      fixture.context.kmd,
    );

    await setEndTime(0);
    await expect(delegatedOptIn(testAccount, asa, algod)).rejects.toThrowError('opcodes=global LatestTimestamp; >; assert;');
  });

  test('setSignatureForSpecificAddress', async () => {
    const { appId } = await master.appClient.getAppReference();
    const { algod, testAccount } = fixture.context;

    const addressSpecificOptInTeal = readFileSync('./contracts/optin_lsig.teal')
      .toString()
      .replace('TMPL_MASTER_APP', appId.toString())
      .replace('TMPL_AUTHORIZED_ADDRESS', testAccount.addr);

    compiledAddressSpecificOptInTeal = await algod.compile(addressSpecificOptInTeal).do();

    const lsig = new algosdk.LogicSigAccount(Buffer.from(compiledAddressSpecificOptInTeal.result, 'base64'));

    lsig.sign(receiver.sk);

    const hash = sha256(Buffer.from(concatArrays(
      algosdk.decodeAddress(testAccount.addr).publicKey,
      algosdk.decodeAddress(receiver.addr).publicKey,
    )), { asBytes: true });

    const boxRef = concatArrays(Buffer.from('s-'), hash);

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(22400), ...SUPPRESS_LOG });

    await master.setSignatureForSpecificAddress(
      {
        sig: lsig.lsig.sig!,
        allowedAddress: testAccount.addr,
      },
      {
        sender: receiver,
        boxes: [boxRef],
      },
    );

    const boxValue = await master.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(lsig.lsig.sig);
  });
});
