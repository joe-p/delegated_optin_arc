import { Contract } from '@algorandfoundation/tealscript';

type Method = {app: Application, selector: string};

// eslint-disable-next-line no-unused-vars
class Master extends Contract {
  sigs = new BoxMap<Address, byte<64>>({ prefix: 'sig' });

  sigVerificationAddress = new GlobalReference<Address>();

  verificationMethod = new BoxMap<Address, Method>();

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
   * Sets which app and method should be called to verify an opt in
   *
   * @param appID - The app with the verifcation method
   * @param selector - The selector of the verification method
   *
   */
  setVerificationMehod(appID: uint64, selector: string): void {
    assert(this.txn.sender === this.app.creator);

    const method: Method = { app: Application.fromIndex(appID), selector: selector };

    this.verificationMethod.put(this.txn.sender, method);
  }

  /**
   * Verifies that the opt in is allowed
   *
   * @param optIn - The opt in transaction, presumably from the delegated lsig
   * @param verificationTxn - The app call to the verification app
   *
   */
  verify(
    optIn: AssetTransferTxn,
    verificationTxn: AppCallTxn,
  ): void {
    if (!this.verificationMethod.exists(optIn.assetReceiver)) return;

    const method = this.verificationMethod.get(optIn.assetReceiver);

    assert(verificationTxn.applicationArgs[0] === method.selector);
    assert(verificationTxn.applicationID === method.app);
  }
}

type Whitelist = {account: Address, boxID: uint16};

const ALLOW_ALL = 0 as uint8;
const ALLOW_NONE = 2 as uint8;

// eslint-disable-next-line no-unused-vars
class WhitelistApp extends Contract {
  whitelist = new BoxMap<Whitelist, Address[]>();

  status = new BoxMap<Address, uint8>({ prefix: 'status' });

  private verifyMBRPayment(payment: PayTxn, preMBR: uint64): void {
    assert(payment.amount === this.app.address.minBalance - preMBR);
    assert(payment.receiver === this.app.address);
  }

  private sendMBRPayment(preMBR: uint64): void {
    sendPayment({
      sender: this.app.address,
      receiver: this.txn.sender,
      amount: preMBR - this.app.address.minBalance,
      fee: 0,
    });
  }

  /**
   * Add address to whitelist box
   *
   * @param boxID - The ID of the whitelist box to add the address to
   * @param addr - The address to add to the whitelist
   * @param payment - The payment transaction to cover the MBR change
   *
   */
  addToWhitelist(boxID: uint16, addr: Address, payment: PayTxn): void {
    const preMBR = this.app.address.minBalance;
    const whitelist: Whitelist = { account: this.txn.sender, boxID: boxID };

    if (this.whitelist.exists(whitelist)) {
      this.whitelist.get(whitelist).push(addr);
    } else {
      const newWhitelist: Address[] = [addr];
      this.whitelist.put(whitelist, newWhitelist);
    }

    this.verifyMBRPayment(payment, preMBR);
  }

  /**
   * Sets a address whitelist for the sender. Should only be used when adding/removing
   * more than one address
   *
   * @param boxID - The ID of the whitelist box to put the addresses in
   * @param addrs - Array of addresses that signify the whitelisted addresses
   *
   */
  setWhitelist(boxID: uint16, addrs: Address[]): void {
    const preMBR = this.app.address.minBalance;
    const whitelist: Whitelist = { account: this.txn.sender, boxID: boxID };

    this.whitelist.delete(whitelist);

    this.whitelist.put(whitelist, addrs);

    if (preMBR > this.app.address.minBalance) {
      this.sendMBRPayment(preMBR);
    } else {
      this.verifyMBRPayment(this.txnGroup[this.txn.groupIndex - 1], preMBR);
    }
  }

  /**
   * Deletes a address whitelist for the sender
   *
   * @param boxID - The ID of the whitelist box to delete
   *
   */
  deleteWhitelist(boxID: uint16): void {
    const preMBR = this.app.address.minBalance;
    const whitelist: Whitelist = { account: this.txn.sender, boxID: boxID };

    this.whitelist.delete(whitelist);

    this.sendMBRPayment(preMBR);
  }

  /**
   * Deletes a address from a whitelist for the sender
   *
   * @param boxID - The ID of the whitelist box to delete from
   * @param addr - The address to delete from the whitelist
   * @param index - The index of the address in the whitelist
   *
   */
  deleteFromWhitelist(boxID: uint16, addr: Address, index: uint64): void {
    const preMBR = this.app.address.minBalance;
    const whitelist: Whitelist = { account: this.txn.sender, boxID: boxID };

    const spliced = this.whitelist.get(whitelist).splice(index, 1);

    assert(spliced[0] === addr);

    this.sendMBRPayment(preMBR);
  }

  /**
   * Verifies that the sender is in the whitelist
   *
   * @param boxID - The ID of the whitelist box to delete from
   * @param index - The index of the address in the whitelist
   *
   */
  verifySender(
    boxID: uint16,
    index: uint64,
  ): void {
    const optIn = this.txnGroup[this.txn.groupIndex - 1];
    if (!this.status.exists(optIn.assetReceiver)) return;

    const status = this.status.get(optIn.assetReceiver);
    assert(status !== ALLOW_NONE);
    if (status === ALLOW_ALL) return;

    const whitelist: Whitelist = { account: optIn.assetReceiver, boxID: boxID };

    const whitelistAddr = this.whitelist.get(whitelist)[index];
    assert(whitelistAddr === this.txn.sender);
  }

  /**
   * Set the status of the opt-in whitelist
   *
   * @param status - 0 for allowing all opt ins, 1 for allowing only whitelisted opt ins,
   * 2 for allowing no opt ins. If status doesn't exist, it is assumed to be 0
   *
   */
  setWhitelistStatus(status: uint8): void {
    assert(status <= ALLOW_NONE);
    this.status.put(this.txn.sender, status);
  }
}
