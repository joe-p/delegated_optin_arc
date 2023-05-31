import { Contract } from '@algorandfoundation/tealscript';

type Allowlist = {account: Address, boxID: uint16};

const ALLOW_ALL = 0 as uint8;
const ALLOW_NONE = 2 as uint8;

// eslint-disable-next-line no-unused-vars
class AllowlistApp extends Contract {
  allowlist = new BoxMap<Allowlist, Address[]>();

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
   * Add address to allowlist box
   *
   * @param boxID - The ID of the allowlist box to add the address to
   * @param addr - The address to add to the allowlist
   * @param payment - The payment transaction to cover the MBR change
   *
   */
  addToAllowlist(boxID: uint16, addr: Address, payment: PayTxn): void {
    const preMBR = this.app.address.minBalance;
    const allowlist: Allowlist = { account: this.txn.sender, boxID: boxID };

    if (this.allowlist.exists(allowlist)) {
      this.allowlist.get(allowlist).push(addr);
    } else {
      const newAllowlist: Address[] = [addr];
      this.allowlist.put(allowlist, newAllowlist);
    }

    this.verifyMBRPayment(payment, preMBR);
  }

  /**
   * Sets a address allowlist for the sender. Should only be used when adding/removing
   * more than one address
   *
   * @param boxID - The ID of the allowlist box to put the addresses in
   * @param addrs - Array of addresses that signify the allowlisted addresses
   *
   */
  setAllowlist(boxID: uint16, addrs: Address[]): void {
    const preMBR = this.app.address.minBalance;
    const allowlist: Allowlist = { account: this.txn.sender, boxID: boxID };

    this.allowlist.delete(allowlist);

    this.allowlist.put(allowlist, addrs);

    if (preMBR > this.app.address.minBalance) {
      this.sendMBRPayment(preMBR);
    } else {
      this.verifyMBRPayment(this.txnGroup[this.txn.groupIndex - 1], preMBR);
    }
  }

  /**
   * Deletes a address allowlist for the sender
   *
   * @param boxID - The ID of the allowlist box to delete
   *
   */
  deleteAllowlist(boxID: uint16): void {
    const preMBR = this.app.address.minBalance;
    const allowlist: Allowlist = { account: this.txn.sender, boxID: boxID };

    this.allowlist.delete(allowlist);

    this.sendMBRPayment(preMBR);
  }

  /**
   * Deletes a address from a allowlist for the sender
   *
   * @param boxID - The ID of the allowlist box to delete from
   * @param addr - The address to delete from the allowlist
   * @param index - The index of the address in the allowlist
   *
   */
  deleteFromAllowlist(boxID: uint16, addr: Address, index: uint64): void {
    const preMBR = this.app.address.minBalance;
    const allowlist: Allowlist = { account: this.txn.sender, boxID: boxID };

    const spliced = this.allowlist.get(allowlist).splice(index, 1);

    assert(spliced[0] === addr);

    this.sendMBRPayment(preMBR);
  }

  /**
   * Verifies that the sender is in the allowlist
   *
   * @param boxID - The ID of the allowlist box to delete from
   * @param index - The index of the address in the allowlist
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

    const allowlist: Allowlist = { account: optIn.assetReceiver, boxID: boxID };

    const allowlistAddr = this.allowlist.get(allowlist)[index];
    assert(allowlistAddr === this.txn.sender);
  }

  /**
   * Set the status of the opt-in allowlist
   *
   * @param status - 0 for allowing all opt ins, 1 for allowing only allowlisted opt ins,
   * 2 for allowing no opt ins. If status doesn't exist, it is assumed to be 0
   *
   */
  setAllowlistStatus(status: uint8): void {
    assert(status <= ALLOW_NONE);
    this.status.put(this.txn.sender, status);
  }
}
