import { Contract } from '@algorandfoundation/tealscript';

type byte32 = StaticArray<byte, 32>;
type byte64 = StaticArray<byte, 64>;

// eslint-disable-next-line no-unused-vars
class DelegatedOptIn extends Contract {
  // ************ Meta State ************ //

  // The address of the lsig that verifies signatures before being added to box storage
  sigVerificationAddress = new GlobalStateKey<Address>();

  // The minimum balance requirement for ASAs
  assetMBR = new GlobalStateKey<uint64>();

  // ************ Open Opt-In State ************ //

  // Mapping of public key to signed open opt-in lsig
  openOptInSignatures = new BoxMap<Address, byte64>({ prefix: 's-' });

  // Mapping of address to timestamp until which open opt-ins are allowed
  openOptInEndTimes = new BoxMap<Address, uint64>({ prefix: 'e-' });

  // ************ Address Opt-In State ************ //

  // Mapping of hash(sender address + receiver public key) to
  // signed address opt-in lsig for sender address
  addressOptInSignatures = new BoxMap<byte32, byte64>({ prefix: 's-' });

  // Mapping of hash(sender address + receiver address ) to timestamp until which
  // address pt-ins from the sender address are allowed
  addressOptInEndTimes = new BoxMap<byte32, uint64>({ prefix: 'e-' });

  private getSenderReceiverHash(sender: Address, receiverOrSigner: Address): byte32 {
    return sha256(concat(sender, receiverOrSigner));
  }

  @handle.createApplication
  create(): void {
    this.assetMBR.set(100_000);
  }

  // ************ Meta Methods ************ //

  /**
   * Set the address of the verifier lsig. This will only be called once after creation.
   *
   * @param lsig - The address of the verifier lsig
   *
   */
  setSigVerificationAddress(lsig: Address): void {
    assert(this.txn.sender === this.app.creator);
    assert(!this.sigVerificationAddress.exists());
    this.sigVerificationAddress.set(lsig);
  }

  /**
   * Updates the asset MBR
   * @param mbrPayment - Payment to the receiver that covers the ASA MBR
   * @param asset - The asset to opt into and opt out of to determine MBR
   *
   */
  updateAssetMBR(asset: Asset): void {
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

  // ************ Open Opt-In Methods ************ //

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param signer - The public key corresponding to the signature
   * @param verifier - A txn from the verifier lsig to openOptIn the signature
   *
   */
  setOpenOptInSignature(sig: byte64, signer: Address, verifier: Txn): void {
    assert(verifier.sender === this.sigVerificationAddress.get());

    this.openOptInSignatures.set(signer, sig);
  }

  /**
   * Verifies that the opt in is allowed
   *
   * @param optIn - The opt in transaction, presumably from the open opt-in lsig
   *
   */
  openOptIn(mbrPayment: PayTxn, optIn: AssetTransferTxn): void {
    // Verify mbr payment
    assert(optIn.assetReceiver === mbrPayment.receiver);
    assert(mbrPayment.amount >= this.assetMBR.get());

    // If endTimes box exists, openOptIn that the opt in is before the end time
    if (this.openOptInEndTimes.exists(optIn.assetReceiver)) {
      assert(this.openOptInEndTimes.get(optIn.assetReceiver) > globals.latestTimestamp);
    }
  }

  /**
   * Set the timestamp until which the account allows opt ins
   *
   * @param timestamp - After this time, opt ins will no longer be allowed
   *
   */
  setOpenOptInEndTime(timestamp: uint64): void {
    this.openOptInEndTimes.set(this.txn.sender, timestamp);
  }

  // ************ Address Opt-In Methods ************ //

  /**
   * Set the signature of the lsig for the given account
   *
   * @param sig - The signature of the lsig
   * @param signer - The public key corresponding to the signature
   *
   */
  setAddressOptInSignature(
    sig: byte64,
    signer: Address,
    allowedAddress: Address,
    verifier: Txn,
  ): void {
    assert(verifier.sender === this.sigVerificationAddress.get());

    const hash = this.getSenderReceiverHash(allowedAddress, signer);

    this.addressOptInSignatures.set(hash, sig);
  }

  /**
   * Verifies that the opt in is allowed from the sender
   *
   * @param mbrPayment - Payment to the receiver that covers the ASA MBR
   * @param optIn - The opt in transaction, presumably from the address opt-in lsig
   *
   */
  addressOptIn(mbrPayment: PayTxn, optIn: AssetTransferTxn): void {
    // Verify mbr payment
    assert(optIn.assetReceiver === mbrPayment.receiver);
    assert(mbrPayment.amount >= this.assetMBR.get());

    const hash = this.getSenderReceiverHash(this.txn.sender, optIn.assetReceiver);

    // If endTimes box exists, openOptIn that the opt in is before the end time
    if (this.addressOptInEndTimes.exists(hash)) {
      assert(this.addressOptInEndTimes.get(hash) > globals.latestTimestamp);
    }
  }

  /**
   * Set the timestamp until which the account allows opt ins for a specific address
   *
   * @param timestamp - After this time, opt ins will no longer be allowed
   * @param allowedAddress - The address to set the end time for
   *
   */
  setAddressOptInEndTime(timestamp: uint64, allowedAddress: Address): void {
    const hash = this.getSenderReceiverHash(allowedAddress, this.txn.sender);

    this.addressOptInEndTimes.set(hash, timestamp);
  }
}
