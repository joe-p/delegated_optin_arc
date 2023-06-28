/* eslint-disable no-plusplus */
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import {
  describe, beforeEach, test, expect,
} from '@jest/globals';
import { readFileSync } from 'fs';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { MasterClient } from '../master_client';

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

let master: MasterClient;
let compiledVerifierTeal: {hash: string, result: string};
let compiledOptInTeal: {hash: string, result: string};

const SUPPRESS_LOG = { sendParams: { suppressLog: true } };

describe('Master Contract', () => {
  const fixture = algorandFixture();
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

    const receiver = algosdk.generateAccount();

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
});
