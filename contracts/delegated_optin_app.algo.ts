/* eslint-disable prefer-destructuring */
import { Contract } from '@algorandfoundation/tealscript';

type byte64 = StaticArray<byte, 64>;

// eslint-disable-next-line no-unused-vars
class DelegatedOptIn extends Contract {
  // Mapping of auth address to signed open opt-in lsig
  signatures = BoxMap<Address, byte64>();

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param boxMBRPayment - Payment to cover the contract MBR for box creation
   *
   */
  setSignature(sig: byte64, boxMBRPayment: PayTxn): void {
    /// Record MBR before box_put to later determine the MBR delta
    const preMBR = globals.currentApplicationAddress.minBalance;
    this.signatures(this.txn.sender).value = sig;

    /// Verify box MBR payment
    verifyTxn(boxMBRPayment, {
      receiver: globals.currentApplicationAddress,
      amount: { greaterThanEqualTo: globals.currentApplicationAddress.minBalance - preMBR },
    });
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
    assert(this.signatures(optIn.sender).exists);

    verifyTxn(optIn, {
      rekeyTo: globals.zeroAddress,
      assetAmount: 0,
      assetReceiver: optIn.sender,
      fee: 0,
      assetCloseTo: globals.zeroAddress,
      assetSender: globals.zeroAddress,
    });

    /// TODO: Replace 100_000 with ASA MBR global
    verifyTxn(mbrPayment, {
      receiver: optIn.assetReceiver,
      amount: { greaterThanEqualTo: 100_000 },
    });
  }

  /**
   * Delete the signature from box storage. This will disable delegated opt-ins and
   * return the box MBR balance. This app call should include an extra 0.001 ALGO to cover
   * the inner transaction fee for the payment.
   */
  revokeSignature(): void {
    /// Record MBR before box_del to later determine the MBR delta
    const preMBR = globals.currentApplicationAddress.minBalance;
    this.signatures(this.txn.sender).delete();

    /// Return the box MBR
    sendPayment({
      fee: 0,
      amount: preMBR - globals.currentApplicationAddress.minBalance,
      receiver: this.txn.sender,
    });
  }
}
