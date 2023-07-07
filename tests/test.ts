/* eslint-disable no-plusplus */
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import {
  describe, beforeEach, test, expect, beforeAll,
} from '@jest/globals';
import { readFileSync } from 'fs';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import sha256 from 'sha256';
import { DelegatedOptInClient } from '../delegated_optin_client';

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

const ADDRESS_OPTIN_TEAL = readFileSync('./contracts/address_optin_lsig.teal').toString();
const OPEN_OPTIN_TEAL = readFileSync('./contracts/open_optin_lsig.teal').toString();
const VERIFIER_TEAL = readFileSync('./contracts/verifier_lsig.teal').toString();

async function generateAddressSpecificOptInLsig(
  algod: algosdk.Algodv2,
  authorizedAddr: string,
  appId: number,
): Promise<algosdk.LogicSigAccount> {
  const teal = ADDRESS_OPTIN_TEAL
    .replace('TMPL_DELEGATED_OPTIN_APP_ID', appId.toString())
    .replace('TMPL_AUTHORIZED_ADDRESS', authorizedAddr);

  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(Buffer.from(compiledTeal.result, 'base64'));
}

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

async function generateVerifierLsig(
  algod: algosdk.Algodv2,
  appId: number,
  receiverAddr: string,
): Promise<algosdk.LogicSigAccount> {
  const optInLsig = await generateOptInLsig(algod, appId);
  const toBeSigned = concatArrays(optInLsig.lsig.tag, optInLsig.lsig.logic);

  const addrOptInLsig = await generateAddressSpecificOptInLsig(algod, receiverAddr, appId);
  const addrToBeSigned = concatArrays(addrOptInLsig.lsig.tag, addrOptInLsig.lsig.logic);

  const teal = VERIFIER_TEAL
    .replace('TMPL_OPEN_OPTIN_DATA', `0x${Buffer.from(toBeSigned).toString('hex')}`)
    .replace('TMPL_ADDRESS_OPTIN_DATA', `0x${Buffer.from(addrToBeSigned).toString('hex')}`);
  const compiledTeal = await algod.compile(teal).do();

  return new algosdk.LogicSigAccount(
    Buffer.from(compiledTeal.result, 'base64'),
  );
}

async function delegatedOptIn(
  {
    senderAddr, senderSigner, asa, algod, type, receiverAddr, app, lsig,
  }: { senderAddr: string; senderSigner: algosdk.TransactionSigner; asa: number; algod: algosdk.Algodv2; type: 'open' | 'address'; receiverAddr: string; app: DelegatedOptInClient; lsig: algosdk.LogicSigAccount},
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

  const prefix = Buffer.from('e-');

  let key: Uint8Array;

  if (type === 'open') {
    key = algosdk.decodeAddress(receiverAddr).publicKey;
  } else {
    key = Buffer.from(sha256(Buffer.from(concatArrays(
      algosdk.decodeAddress(senderAddr).publicKey,
      algosdk.decodeAddress(receiverAddr).publicKey,
    )), { asBytes: true }));
  }
  const boxRef = concatArrays(prefix, key);

  const args = {
    mbrPayment: {
      txn: pay,
      signer: senderSigner,
    },
    optIn: {
      txn: optIn,
      signer: algosdk.makeLogicSigAccountTransactionSigner(lsig),
    },
  };

  const params = {
    boxes: [{ appIndex: 0, name: boxRef }],
    ...SUPPRESS_LOG,
    sender: { addr: senderAddr, signer: senderSigner },
  };

  if (type === 'open') {
    await app.openOptIn(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      args,
      params,
    );
  } else {
    await app.addressOptIn(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      args,
      params,
    );
  }
}

async function setEndTime({
  time, type, receiverAddr, receiverSigner, app, senderAddr,
}: { time: number; type: 'open' | 'address'; receiverAddr: string; receiverSigner: algosdk.TransactionSigner; app: DelegatedOptInClient; senderAddr?: string; }) {
  const prefix = Buffer.from('e-');

  let key: Uint8Array;

  if (type === 'open') {
    key = algosdk.decodeAddress(receiverAddr).publicKey;
  } else if (type === 'address') {
    if (senderAddr === undefined) throw Error();

    key = Buffer.from(sha256(Buffer.from(concatArrays(
      algosdk.decodeAddress(senderAddr).publicKey,
      algosdk.decodeAddress(receiverAddr).publicKey,
    )), { asBytes: true }));
  } else throw Error();

  const boxRef = concatArrays(prefix, key);

  const args = {
    timestamp: BigInt(time),
  };

  const params = {
    boxes: [boxRef],
    sender: { addr: receiverAddr, signer: receiverSigner },
    ...SUPPRESS_LOG,
  };

  if (type === 'open') {
    await app.setOpenOptInEndTime(
      args,
      params,
    );
  } else if (type === 'address') {
    await app.setAddressOptInEndTime(
      { ...args, allowedAddress: senderAddr! },
      params,
    );
  }
}

describe('Delegated Opt In App', () => {
  const fixture = algorandFixture();
  let app: DelegatedOptInClient;
  let receiver: algosdk.Account;
  let appId: number;

  beforeAll(() => {
    receiver = algosdk.generateAccount();
  });

  beforeEach(fixture.beforeEach, 10_000);

  test('Create', async () => {
    app = new DelegatedOptInClient({
      sender: fixture.context.testAccount,
      resolveBy: 'id',
      id: 0,
    }, fixture.context.algod);

    await app.create.bare(SUPPRESS_LOG);

    appId = Number((await app.appClient.getAppReference()).appId);
  });

  test('setSigVerificationAddress', async () => {
    const verifierLsig = await generateVerifierLsig(fixture.context.algod, appId, receiver.addr);

    await app.setSigVerificationAddress(
      {
        lsig: verifierLsig.address(),
      },
      SUPPRESS_LOG,
    );
  });

  test('setOpenOptInSignature', async () => {
    const { algod } = fixture.context;

    const optInLsig = await generateOptInLsig(algod, appId);

    optInLsig.sign(receiver.sk);

    const verifierLsig = await generateVerifierLsig(algod, appId, receiver.addr);

    const verifierTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: { ...(await algod.getTransactionParams().do()), fee: 0, flatFee: true },
      from: verifierLsig.address(),
      to: verifierLsig.address(),
      amount: 0,
    });

    const prefix = Buffer.from('s-');
    const key = algosdk.decodeAddress(receiver.addr).publicKey;
    const boxRef = concatArrays(prefix, key);

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(141700), ...SUPPRESS_LOG });

    await app.setOpenOptInSignature(
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

    const boxValue = await app.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(optInLsig.lsig.sig);
  });

  test('openOptIn', async () => {
    const { testAccount, algod } = fixture.context;

    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do())
      .rejects.toThrowError('account asset info not found');

    const lsig = await generateOptInLsig(algod, appId);
    lsig.sign(receiver.sk);

    await delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'open',
      receiverAddr: receiver.addr,
      app,
      lsig,
    });

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setOpenOptInEndTime - 0xffffffff', async () => {
    const { testAccount, algod } = fixture.context;

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
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

    await setEndTime({
      time: 0xffffffff,
      type: 'open',
      receiverAddr: receiver.addr,
      receiverSigner: algosdk.makeBasicAccountTransactionSigner(receiver),
      app,
    });

    const lsig = await generateOptInLsig(algod, appId);
    lsig.sign(receiver.sk);

    await delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'open',
      receiverAddr: receiver.addr,
      app,
      lsig,
    });

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setOpenOptInEndTime - 0', async () => {
    const { testAccount, algod } = fixture.context;

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
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

    await setEndTime({
      time: 0,
      type: 'open',
      receiverAddr: receiver.addr,
      receiverSigner: algosdk.makeBasicAccountTransactionSigner(receiver),
      app,
    });

    const lsig = await generateOptInLsig(algod, appId);
    lsig.sign(receiver.sk);

    await expect(delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'open',
      receiverAddr: receiver.addr,
      app,
      lsig,
    })).rejects.toThrowError('opcodes=global LatestTimestamp; >; assert;');
  });

  test('setAddressOptInSignature', async () => {
    const { algod, testAccount } = fixture.context;

    const lsig = await generateAddressSpecificOptInLsig(algod, testAccount.addr, appId);

    lsig.sign(receiver.sk);

    const hash = sha256(Buffer.from(concatArrays(
      algosdk.decodeAddress(testAccount.addr).publicKey,
      algosdk.decodeAddress(receiver.addr).publicKey,
    )), { asBytes: true });

    const boxRef = concatArrays(Buffer.from('s-'), hash);

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(22400), ...SUPPRESS_LOG });

    const verifierLsig = await generateVerifierLsig(algod, appId, receiver.addr);

    const verifierTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: { ...(await algod.getTransactionParams().do()), fee: 0, flatFee: true },
      from: verifierLsig.address(),
      to: verifierLsig.address(),
      amount: 0,
    });

    await app.setAddressOptInSignature(
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

    const boxValue = await app.appClient.getBoxValue(boxRef);

    expect(boxValue).toEqual(lsig.lsig.sig);
  });

  test('addressoptOptIn', async () => {
    const { testAccount, algod } = fixture.context;

    const asa = await createASA(algod, fixture.context.testAccount);

    await expect(algod.accountAssetInformation(receiver.addr, asa).do())
      .rejects.toThrowError('account asset info not found');

    const lsig = await generateAddressSpecificOptInLsig(algod, testAccount.addr, appId);
    lsig.sign(receiver.sk);

    await delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'address',
      receiverAddr: receiver.addr,
      app,
      lsig,
    });

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setAddressOptInEndtime - 0xffffffff', async () => {
    const { testAccount, algod } = fixture.context;

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
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

    await setEndTime({
      time: 0xffffffff,
      type: 'address',
      receiverAddr: receiver.addr,
      receiverSigner: algosdk.makeBasicAccountTransactionSigner(receiver),
      app,
      senderAddr: testAccount.addr,
    });

    const lsig = await generateAddressSpecificOptInLsig(algod, testAccount.addr, appId);
    lsig.sign(receiver.sk);

    await delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'address',
      receiverAddr: receiver.addr,
      app,
      lsig,
    });

    expect((await algod.accountAssetInformation(receiver.addr, asa).do())['asset-holding'].amount).toBe(0);
  });

  test('setAddressOptInEndTime - 0', async () => {
    const { testAccount, algod } = fixture.context;

    await app.appClient.fundAppAccount({ amount: algokit.microAlgos(19300), ...SUPPRESS_LOG });
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

    await setEndTime({
      time: 0,
      type: 'address',
      receiverAddr: receiver.addr,
      receiverSigner: algosdk.makeBasicAccountTransactionSigner(receiver),
      app,
      senderAddr: testAccount.addr,
    });

    const lsig = await generateAddressSpecificOptInLsig(algod, testAccount.addr, appId);
    lsig.sign(receiver.sk);

    await expect(delegatedOptIn({
      senderAddr: testAccount.addr,
      senderSigner: algosdk.makeBasicAccountTransactionSigner(testAccount),
      asa,
      algod,
      type: 'address',
      receiverAddr: receiver.addr,
      app,
      lsig,
    })).rejects.toThrowError('opcodes=global LatestTimestamp; >; assert;');
  });
});
