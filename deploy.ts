import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { readFileSync } from 'fs';
import appSpec from './contracts/artifacts/OptInARC.json';

const algodClient = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
const indexerClient = new algosdk.Indexer('a'.repeat(64), 'http://localhost', 8980);
const kmdClient = new algosdk.Kmd('a'.repeat(64), 'http://localhost', 4002);

async function deploy() {
  const sender = await algokit.getDispenserAccount(algodClient, kmdClient);
  const app = algokit.getAppClient(
    {
      app: JSON.stringify(appSpec),
      sender,
      creatorAddress: sender.addr,
      indexer: indexerClient,
    },
    algodClient,
  );

  const { appId } = await app.create();

  const optInLsigTeal = readFileSync('./contracts/optin_lsig.teal')
    .toString()
    .replace('TMPL_WHITELIST_APP', appId.toString());

  const compiledOptInLsig = await algodClient.compile(optInLsigTeal).do();

  const optInLsigBytes = Buffer.from(compiledOptInLsig.result, 'base64').toString('hex');

  const verifierLsigTeal = readFileSync('./contracts/verifier.teal')
    .toString()
    .replace('TMPL_LSIG_PROGRAM', `0x${optInLsigBytes}`);

  const compiledVerifierTeal = await algodClient.compile(verifierLsigTeal).do();

  await app.call({
    method: 'setVerifierAddress',
    methodArgs: [compiledVerifierTeal.hash],
  });
}

deploy();
