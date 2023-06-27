import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { readFileSync } from 'fs';
import masterAppSpec from './contracts/artifacts/Master.json';

const algodClient = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
const indexerClient = new algosdk.Indexer('a'.repeat(64), 'http://localhost', 8980);
const kmdClient = new algosdk.Kmd('a'.repeat(64), 'http://localhost', 4002);

async function deploy() {
  const sender = await algokit.getDispenserAccount(algodClient, kmdClient);
  const master = algokit.getAppClient(
    {
      app: JSON.stringify(masterAppSpec),
      sender,
      resolveBy: 'id',
      id: 0,
    },
    algodClient,
  );

  const { appId } = await master.create();

  const optInLsigTeal = readFileSync('./contracts/optin_lsig.teal')
    .toString()
    .replace('TMPL_MASTER_APP', appId.toString());

  const compiledOptInLsig = await algodClient.compile(optInLsigTeal).do();

  const optInLsigBytes = Buffer.from(compiledOptInLsig.result, 'base64').toString('hex');

  const verifierLsigTeal = readFileSync('./contracts/verifier.teal')
    .toString()
    .replace('TMPL_OPT_IN_PROGRAM', `0x${optInLsigBytes}`);

  const compiledVerifierTeal = await algodClient.compile(verifierLsigTeal).do();

  await master.call({
    method: 'setSigVerificationAddress',
    methodArgs: [compiledVerifierTeal.hash],
  });
}

deploy();
