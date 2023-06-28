import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { describe, beforeEach, test } from '@jest/globals';
import { readFileSync } from 'fs';
import algosdk, { AtomicTransactionComposer } from 'algosdk';
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

    await master.create.bare();

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
    await master.setSigVerificationAddress({
      lsig: compiledVerifierTeal.hash,
    });
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
      suggestedParams: await algod.getTransactionParams().do(),
      from: verifierAcct.address(),
      to: verifierAcct.address(),
      amount: 0,
    });

    const atc = new AtomicTransactionComposer();

    atc.addMethodCall({
      appID: Number((await master.appClient.getAppReference()).appId),
      suggestedParams: await algod.getTransactionParams().do(),
      method: master.appClient.getABIMethod('setSignature')!,
      methodArgs: [optInLsig.sig!, fixture.context.testAccount.addr, {
        txn: verifierTxn,
        signer: algosdk.makeLogicSigAccountTransactionSigner(verifierAcct),
      }],
      sender: fixture.context.testAccount.addr,
      signer: algosdk.makeBasicAccountTransactionSigner(fixture.context.testAccount),
    });

    const txns = atc.buildGroup().map((t) => t.txn);
    const sigs = (await atc.gatherSignatures())
      .map((s) => (algosdk.decodeObj(s) as algosdk.SignedTransaction).sig);

    const dr = await algosdk.createDryrun({
      client: algod,
      txns: [{ txn: txns[0] }, { txn: txns[1], sig: sigs[1] }],
    });

    const drr = new algosdk.DryrunResult(await algod.dryrun(dr).do());

    console.log(drr.txns[0].logicSigTrace);
    await atc.execute(algod, 3);

    /*
    await master.setSignature({
      sig: optInLsig.sig!,
      signer: fixture.context.testAccount.addr,
      verifier: {
        txn: verifierTxn,
        // @ts-ignore
        signer: algosdk.makeLogicSigAccountTransactionSigner(verifierAcct),
      },
    });
    */
  });
});
