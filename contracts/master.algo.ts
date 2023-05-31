import { Contract } from '@algorandfoundation/tealscript';

type Method = {app: Application, selector: string};

// eslint-disable-next-line no-unused-vars
class Master extends Contract {
  sigs = new BoxMap<Address, byte<64>>({ prefix: 'sig' });

  sigVerificationAddress = new GlobalReference<Address>();

  verificationMethods = new BoxMap<Address, Method[]>();

  /**
   * Set the address of the verifier lsig. This will only be called once after creation.
   *
   * @param setVerifierAddress - The address of the verifier lsig
   *
   */
  setSigVerificationAddress(lsig: Address): void {
    assert(this.txn.sender === this.app.creator);
    assert(!this.sigVerificationAddress.exists());
    this.sigVerificationAddress.put(lsig);
  }

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param authAddr - The auth address of the account
   * @param acct - The account to set the signature for
   * @param verifier - A txn from the verifier lsig to verify the signature
   *
   */
  setSignature(sig: byte<64>, authAddr: Address, acct: Account, verifier: Txn): void {
    const trueAuthAddr = (acct.authAddr === globals.zeroAddress) ? acct : acct.authAddr;

    assert(authAddr === trueAuthAddr);
    assert(verifier.sender === this.sigVerificationAddress.get());

    // Only allow this method to be called if the sig is new (acct has been rekeyed)
    if (this.sigs.exists(acct)) assert(this.sigs.get(acct) !== sig);

    this.sigs.put(acct, sig);
  }

  /**
   * Sets which apps/methods can be called to verify an opt in for the sender
   *
   * @param appID - The app with the verifcation method
   * @param selector - The selector of the verification method
   *
   */
  setVerificationMethods(methods: Method[]): void {
    this.verificationMethods.put(this.txn.sender, methods);
  }

  /**
   * Verifies that the opt in is allowed
   *
   * @param optIn - The opt in transaction, presumably from the delegated lsig
   * @param verificationTxnIndex - The index of the app call to the verification app
   * @param verifcationMethodIndex - The index of the method to call in the verification app
   *
   */
  verify(
    optIn: AssetTransferTxn,
    verificationTxnIndex: uint64,
    verifcationMethodIndex: uint64,
  ): void {
    if (!this.verificationMethods.exists(optIn.assetReceiver)) return;

    const verificationTxn = this.txnGroup[verificationTxnIndex] as AppCallTxn;
    const method = this.verificationMethods.get(optIn.assetReceiver)[verifcationMethodIndex];

    assert(verificationTxn.applicationArgs[0] === method.selector);
    assert(verificationTxn.applicationID === method.app);
  }
}
