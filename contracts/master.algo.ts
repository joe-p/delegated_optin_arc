import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Master extends Contract {
  sigs = new BoxMap<Address, byte<64>>({ prefix: 's-' });

  endTimes = new BoxMap<Address, uint64>({ prefix: 'e-' });

  sigVerificationAddress = new GlobalReference<Address>();

  assetMBR = new GlobalReference<uint64>();

  @handle.createApplication
  create(): void {
    this.assetMBR.put(100_000);
  }

  /**
   * Updates the asset MBR
   * @param asset - The asset to opt into and opt out of to determine MBR
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
    this.assetMBR.put(mbrDelta);

    sendAssetTransfer({
      assetReceiver: this.app.address,
      xferAsset: asset,
      assetAmount: 0,
      fee: 0,
      assetCloseTo: this.app.address,
    });
  }

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
   * @param signer - The public key corresponding to the signature
   * @param verifier - A txn from the verifier lsig to verify the signature
   *
   */
  setSignature(sig: byte<64>, signer: Address, verifier: Txn): void {
    assert(verifier.sender === this.sigVerificationAddress.get());
    assert(!this.sigs.exists(signer));

    this.sigs.put(signer, sig);
  }

  /**
   * Verifies that the opt in is allowed
   *
   * @param optIn - The opt in transaction, presumably from the delegated lsig
   *
   */
  verify(mbrPayment: PayTxn, optIn: AssetTransferTxn): void {
    // Verify mbr payment
    assert(optIn.assetReceiver === mbrPayment.receiver);
    assert(mbrPayment.sender !== mbrPayment.receiver);
    assert(mbrPayment.amount === this.assetMBR.get());

    // If endTimes box exists, verify that the opt in is before the end time
    if (this.endTimes.exists(optIn.assetReceiver)) {
      assert(this.endTimes.get(optIn.assetReceiver) > globals.latestTimestamp);
    }
  }

  /**
   * Set the timestamp until which the account allows opt ins
   *
   * @param timestamp - After this time, opt ins will no longer be allowed
   *
   */
  setEndTime(timestamp: uint64): void {
    this.endTimes.put(this.txn.sender, timestamp);
  }
}
