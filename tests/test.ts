import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { describe, beforeEach, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { MasterClient } from '../master_client';

let master: MasterClient;

describe('Master Contract', () => {
  const fixture = algorandFixture();
  beforeEach(fixture.beforeEach, 10_000);

  test('Create', async () => {
    master = new MasterClient({
      sender: fixture.context.testAccount,
      resolveBy: 'id',
      id: 0,
    }, fixture.context.algod);
    await master.create.bare();
  });

  test('setSigVerificationAddress', async () => {
    const { appId } = await master.appClient.getAppReference();

    const { algod } = fixture.context;
    const optInLsigTeal = readFileSync('./contracts/optin_lsig.teal')
      .toString()
      .replace('TMPL_MASTER_APP', appId.toString());

    const compiledOptInLsig = await algod.compile(optInLsigTeal).do();

    const optInLsigBytes = Buffer.from(compiledOptInLsig.result, 'base64').toString('hex');

    const verifierLsigTeal = readFileSync('./contracts/verifier.teal')
      .toString()
      .replace('TMPL_OPT_IN_PROGRAM', `0x${optInLsigBytes}`);

    const compiledVerifierTeal = await algod.compile(verifierLsigTeal).do();

    await master.setSigVerificationAddress({
      lsig: compiledVerifierTeal.hash,
    });
  });
});
