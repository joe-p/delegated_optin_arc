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
let receiver: algosdk.Account;
let appId: number;

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

const ADDR_SPECIFIC_TEAL = readFileSync('./contracts/addr_specific_lsig.teal').toString();
const OPT_IN_TEAL = readFileSync('./contracts/optin_lsig.teal').toString();
const VERIFIER_TEAL = readFileSync('./contracts/verifier.teal').toString();

async function generateAddressSpecificOptInLsig(
  algod: algosdk.Algodv2,
  authorizedAddr: string,
): Promise<algosdk.LogicSigAccount> {
  const teal = ADDR_SPECIFIC_TEAL
    .replace('TMPL_MASTER_APP', appId.toString())
    .replace('TMPL_AUTHORIZED_ADDRESS', authorizedAddr);

  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(Buffer.from(compiledTeal.result, 'base64'));
}

async function generateOptInLsig(
  algod: algosdk.Algodv2,
): Promise<algosdk.LogicSigAccount> {
  const teal = OPT_IN_TEAL.replace('TMPL_MASTER_APP', appId.toString());

  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(
    Buffer.from(compiledTeal.result, 'base64'),
  );
}

async function generateVerifierLsig(
  algod: algosdk.Algodv2,
): Promise<algosdk.LogicSigAccount> {
  const optInLsig = await generateOptInLsig(algod);
  const toBeSigned = concatArrays(optInLsig.lsig.tag, optInLsig.lsig.logic);

  const addrOptInLsig = await generateAddressSpecificOptInLsig(algod, receiver.addr);
  const addrToBeSigned = concatArrays(addrOptInLsig.lsig.tag, addrOptInLsig.lsig.logic);

  const teal = VERIFIER_TEAL
    .replace('TMPL_TO_BE_SIGNED', `0x${Buffer.from(toBeSigned).toString('hex')}`)
    .replace('TMPL_ADDR_SPECIFIC_TO_BE_SIGNED', `0x${Buffer.from(addrToBeSigned).toString('hex')}`);
  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(
    Buffer.from(compiledTeal.result, 'base64'),
  );
}

async function delegatedOptIn(
  testAccount: algosdk.Account,
  asa: number,
  algod: algosdk.Algodv2,
) {
  const optInLsig = await generateOptInLsig(algod);

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
    master = new MasterClient({
      sender: fixture.context.testAccount,
      resolveBy: 'id',
      id: 0,
    }, fixture.context.algod);

    await master.create.bare(SUPPRESS_LOG);

    appId = Number((await master.appClient.getAppReference()).appId);
  });

  test('setSigVerificationAddress', async () => {
    const verifierLsig = await generateVerifierLsig(fixture.context.algod);

    await master.setSigVerificationAddress(
      {
        lsig: verifierLsig.address(),
      },
      SUPPRESS_LOG,
    );
  });

  test('setSignature', async () => {
    const { algod } = fixture.context;

    const optInLsig = await generateOptInLsig(algod);

    optInLsig.sign(receiver.sk);

    const verifierLsig = await generateVerifierLsig(algod);

    const verifierTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: { ...(await algod.getTransactionParams().do()), fee: 0, flatFee: true },
      from: verifierLsig.address(),
      to: verifierLsig.address(),
      amount: 0,
    });

    const prefix = Buffer.from('s-');
    const key = algosdk.decodeAddress(receiver.addr).publicKey;
    const boxRef = concatArrays(prefix, key);

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(141700), ...SUPPRESS_LOG });

    await master.setSignature(
      {
        sig: optInLsig.lsig.sig!,
        signer: receiver.addr,
        verifier: {
          txn: verifierTxn,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          signer: algosdk.makeLogicSigAccountTransactionSigner(verifierLsig),
        },
      },
      {
        boxes: [boxRef],
        sendParams: { suppressLog: true, fee: algokit.microAlgos(2_000) },
      },
    );

    const boxValue = await master.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(optInLsig.lsig.sig);
  });

  test('verify', async () => {
    const { testAccount, algod } = fixture.context;

    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do())
      .rejects.toThrowError('account asset info not found');

    await delegatedOptIn(testAccount, asa, algod);

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setEndTime - 0xffffffff', async () => {
    const { testAccount, algod } = fixture.context;

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do())
      .rejects.toThrowError('account asset info not found');

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

    await expect(algod.accountAssetInformation(receiver.addr, asa).do())
      .rejects.toThrowError('account asset info not found');

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
    await expect(delegatedOptIn(testAccount, asa, algod))
      .rejects.toThrowError('opcodes=global LatestTimestamp; >; assert;');
  });

  test('setSignatureForSpecificAddress', async () => {
    const { algod, testAccount } = fixture.context;

    const lsig = await generateAddressSpecificOptInLsig(algod, testAccount.addr);

    lsig.sign(receiver.sk);

    const hash = sha256(Buffer.from(concatArrays(
      algosdk.decodeAddress(testAccount.addr).publicKey,
      algosdk.decodeAddress(receiver.addr).publicKey,
    )), { asBytes: true });

    const boxRef = concatArrays(Buffer.from('s-'), hash);

    await master.appClient.fundAppAccount({ amount: algokit.microAlgos(22400), ...SUPPRESS_LOG });

    const verifierLsig = await generateVerifierLsig(algod);

    const verifierTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: { ...(await algod.getTransactionParams().do()), fee: 0, flatFee: true },
      from: verifierLsig.address(),
      to: verifierLsig.address(),
      amount: 0,
    });

    await master.setSignatureForSpecificAddress(
      {
        sig: lsig.lsig.sig!,
        signer: receiver.addr,
        allowedAddress: testAccount.addr,
        verifier: {
          txn: verifierTxn,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          signer: algosdk.makeLogicSigAccountTransactionSigner(verifierLsig),
        },
      },
      {
        sender: receiver,
        boxes: [boxRef],
        sendParams: { fee: algokit.microAlgos(2_000), suppressLog: true },
      },
    );

    const boxValue = await master.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(lsig.lsig.sig);
  });
});
