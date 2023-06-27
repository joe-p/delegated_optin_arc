import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { readFileSync } from 'fs';
import { MasterClient } from './client';

const algodClient = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
const kmdClient = new algosdk.Kmd('a'.repeat(64), 'http://localhost', 4002);

async function deploy() {
  const sender = await algokit.getDispenserAccount(algodClient, kmdClient) as algosdk.Account;
  const master = new MasterClient({
    sender,
    resolveBy: 'id',
    id: 0,
  }, algodClient);

  const { appId } = await master.appClient.create();

  const optInLsigTeal = readFileSync('./contracts/optin_lsig.teal')
    .toString()
    .replace('TMPL_MASTER_APP', appId.toString());

  const compiledOptInLsig = await algodClient.compile(optInLsigTeal).do();

  const optInLsigBytes = Buffer.from(compiledOptInLsig.result, 'base64').toString('hex');

  const verifierLsigTeal = readFileSync('./contracts/verifier.teal')
    .toString()
    .replace('TMPL_OPT_IN_PROGRAM', `0x${optInLsigBytes}`);

  const compiledVerifierTeal = await algodClient.compile(verifierLsigTeal).do();

  await master.setSigVerificationAddress({
    lsig: compiledVerifierTeal.hash,
  });
}

deploy();
