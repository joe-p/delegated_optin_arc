/* eslint-disable prefer-destructuring */
import { Contract } from '@algorandfoundation/tealscript';

type byte64 = StaticArray<byte, 64>;

// eslint-disable-next-line no-unused-vars
class DelegatedOptIn extends Contract {
  // The minimum balance requirement for ASAs
  // TODO: Delete this once we have global field for asset MBR
  assetMBR = new GlobalStateKey<uint64>();

  // Mapping of auth address to signed open opt-in lsig
  signatures = new BoxMap<Address, byte64>();

  @handle.createApplication
  create(): void {
    /// TODO: Once we have global field for asset MBR, this can be removed
    this.assetMBR.set(100_000);
  }

  /**
   * Updates the asset MBR
   *
   * @param asset - The asset to opt into and opt out of to determine MBR
   *
   */
  updateAssetMBR(asset: Asset): void {
    /// TODO: Replace with global field for getting asset MBR
    const preMbr = this.app.address.minBalance;

    sendAssetTransfer({
      assetReceiver: this.app.address,
      xferAsset: asset,
      assetAmount: 0,
      fee: 0,
    });

    const mbrDelta = preMbr - this.app.address.minBalance;

    assert(mbrDelta !== this.assetMBR.get());
    this.assetMBR.set(mbrDelta);

    sendAssetTransfer({
      assetReceiver: this.app.address,
      xferAsset: asset,
      assetAmount: 0,
      fee: 0,
      assetCloseTo: this.app.address,
    });
  }

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param boxMBRPayment - Payment to cover the contract MBR for box creation
   *
   */
  setSignature(sig: byte64, boxMBRPayment: PayTxn): void {
    /// Calculate the auth address for the sender
    let authAddr = this.txn.sender.authAddr;
    if (authAddr === globals.zeroAddress) authAddr = this.txn.sender;

    /// Record MBR before box_put to later determine the MBR delta
    const preMBR = this.app.address.minBalance;
    this.signatures.set(authAddr, sig);

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
    /// Verify asset mbr payment
    assert(optIn.assetReceiver === mbrPayment.receiver);
    assert(mbrPayment.amount >= this.assetMBR.get());

    /// Verify that the signature is present
    assert(this.signatures.exists(optIn.sender));
  }

  /**
   * Delete the signature from box storage.
   * This will disable delegated opt-ins and return the box MBR balance
   */
  unsetSignature(): void {
    /// Calculate the auth address for the sender
    let authAddr = this.txn.sender.authAddr;
    if (authAddr === globals.zeroAddress) authAddr = this.txn.sender;

    /// Record MBR before box_del to later determine the MBR delta
    const preMBR = this.app.address.minBalance;
    this.signatures.delete(authAddr);

    /// Return the box MBR
    sendPayment({
      fee: 0,
      amount: preMBR - this.app.address.minBalance,
      receiver: this.txn.sender,
    });
  }
}
