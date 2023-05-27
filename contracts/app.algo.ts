import { Contract } from '@algorandfoundation/tealscript';

type Whitelist = {account: Address, boxID: uint16};

// eslint-disable-next-line no-unused-vars
class OptInARC extends Contract {
  whitelist = new BoxMap<Whitelist, Address[]>();

  sigs = new BoxMap<Address, byte<64>>();

  enabled = new BoxMap<Address, boolean>();

  verifier = new GlobalReference<Address>();

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
   * Set the address of the verifier lsig. This will only be called once after creation.
   *
   * @param setVerifierAddress - The address of the verifier lsig
   *
   */
  setVerifierAddress(lsig: Address): void {
    assert(this.txn.sender === this.app.creator);
    assert(!this.verifier.exists());
    this.verifier.put(lsig);
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
    sig: byte<64>,
    optIn: AssetTransferTxn,
    verifyLsig: Txn,
  ): void {
    assert(verifyLsig.sender === this.verifier.get());
    if (!this.sigs.exists(optIn.assetReceiver)) this.sigs.put(optIn.assetReceiver, sig);

    // If the whitelist is not enabled, then no need to check the whitelist
    if (!this.enabled.exists(optIn.assetReceiver) || !this.enabled.get(optIn.assetReceiver)) return;

    const whitelist: Whitelist = { account: optIn.assetReceiver, boxID: boxID };

    const whitelistAddr = this.whitelist.get(whitelist)[index];
    assert(whitelistAddr === this.txn.sender);
  }

  /**
   * Enable or disable the whitelist functionality for the caller
   *
   * @param status - True to enable whitelist, false to disable (allow any account to opt in)
   *
   */
  setWhitelistStatus(status: boolean): void {
    this.enabled.put(this.txn.sender, status);
  }
}
