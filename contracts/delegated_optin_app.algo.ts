/* eslint-disable prefer-destructuring */
import { Contract } from '@algorandfoundation/tealscript';

type byte64 = StaticArray<byte, 64>;

// eslint-disable-next-line no-unused-vars
class DelegatedOptIn extends Contract {
  // Mapping of auth address to signed open opt-in lsig
  signatures = new BoxMap<Address, byte64>();

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param boxMBRPayment - Payment to cover the contract MBR for box creation
   *
   */
  setSignature(sig: byte64, boxMBRPayment: PayTxn): void {
    /// Record MBR before box_put to later determine the MBR delta
    const preMBR = this.app.address.minBalance;
    this.signatures.set(this.txn.sender, sig);

    /// Verify box MBR payment
    assert(boxMBRPayment.receiver === this.app.address);
    assert(boxMBRPayment.amount >= this.app.address.minBalance - preMBR);
  }

  /**
   * Verifies that the opt in is allowed
   *
   * @param mbrPayment - Payment to the receiver that covers the ASA MBR
   * @param optIn - The opt in transaction, presumably from the open opt-in lsig
   *
   */
  delegatedOptIn(mbrPayment: PayTxn, optIn: AssetTransferTxn): void {
    /// Verify that the signature is present
    assert(this.signatures.exists(optIn.sender));
  }

  /**
   * Delete the signature from box storage.
   * This will disable delegated opt-ins and return the box MBR balance
   */
  unsetSignature(): void {
    /// Record MBR before box_del to later determine the MBR delta
    const preMBR = this.app.address.minBalance;
    this.signatures.delete(this.txn.sender);

    /// Return the box MBR
    sendPayment({
      fee: 0,
      amount: preMBR - this.app.address.minBalance,
      receiver: this.txn.sender,
    });
  }
}
