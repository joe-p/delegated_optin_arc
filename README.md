## Abstract
This ARC contains is an implementation of [ARCX](https://github.com/algorandfoundation/ARCs/pull/229). The goal is to provide users a way to delegate asset opt-ins while having a high degree of control compared to a standalone logic signature without an application. The expectation is that a single instance of this ARC will be deployed on Algorand networks. 

## Motivation
[ARCX](https://github.com/algorandfoundation/ARCs/pull/229) provides a standard for delegated asset opt-ins, but there are some UX problems that need to be addressed. First, there needs to be a way to control how long the signature is valid for. Without an application to control this, signing the logic signature program would be irreversible. There also needs to be a standardized way to store and read signatures for a given account so dApps and other users can take advantaged of delegated opt-ins.

## Specification
This is an implementation of [ARCX](https://github.com/algorandfoundation/ARCs/pull/229). There is additional functionality provided by the application in this ARC in the methods of the application.

For all methods, refer to the [ABI JSON description](./contracts/artifacts/DelegatedOptIn.abi.json) for complete descriptions of arguments.

### Signature Storage

`setOpenOptInSignature(byte[64],address,txn)void` and `setAddressOptInSignature(byte[64],address,address,txn)void` are methods for adding signatures to box storage for open opt-ins and address opt-ins, respectively.

Both methods utilize [the verifier lsig](./contracts/verifier_lsig.teal) to verify the address being added to box storage matches the address(es) used as the key. This means anyone can query the applications boxes to get the signature for the given address(es) and be certain that it is correct.

### End Times

`setOpenOptInEndTime(uint64)void` and `setAddressOptInEndTime(uint64,address)void` are methods for setting the end time of a signature for open opt-ins and address opt-ins, respectively. An endtime signifies when the delegated logic signature will no longer work. The time corresponds to the epoch time (seconds) returned by `global LatestTimestamp`. End times can be updated at any time to any value.

### Opt-Ins

`openOptIn(pay,axfer)void` and `addressOptIn(pay,axfer)void` are implementations of the [ARCX](https://github.com/algorandfoundation/ARCs/pull/229) interfaces. They both verify the MBR payment is sent to the account opting in and that it covers the ASA minimum balance requirement, which is stored in global storage. It also verifies the value of `global LatestTimestamp` is less than the set end time for the account opting in.

### Storage

| Type | Key | Description |
| ---- | --- | ----------- |
| Global | "sigVerificationAddress" | Stores the address of [the verifier lsig](./contracts/verifier_lsig.teal) |
| Global | "assetMBR" | Stores the ASA MBR |
| Box | `auth-addr` | Mapping of signer to open opt-in signature |
| Box |  "e-" + `auth-addr` | Mapping of signer to open opt-in end time |
| Box | `(signer,sender)` | Mapping of the hash of the signer address plus sender address to address opt-in signature |
| Box |  "e-" + `sha256(signer,sender)` | Mapping of the hash of the signer address plus sender address to address opt-in end time |

## Rationale
Box storage is used to store signatures indefinitely and [the verifier lsig](./contracts/verifier_lsig.teal) ensures the signature is always correct.

End time functionality is provided to allow users to revert the effects of signing the logic signature programs without having to rekey. It also lets users open their account for opt-in delegations for a short amount of time without having to remember to manually undo it.

Asset MBR is stored in global storage in case the MBR for asset were to ever change.

## Backwards Compatibility
N/A

## Test Cases
Tests written with Jest and algokit for the contract and logic signatures can be seen in [test.ts](./tests/test.ts).

```
Delegated Opt In App
    create
      ✓ creates the app (1427 ms)
    setSigVerificationAddress
      ✓ works with valid address (939 ms)
    setOpenOptInSignature
      ✓ works with valid signature and lsig (1031 ms)
    openOptIn
      ✓ works with valid lsig and method call (973 ms)
    setOpenOptInEndTime
      ✓ works with 0xffffffff as the end time (2091 ms)
      ✓ works with 0 as the end time (1137 ms)
    setAddressOptInSignature
      ✓ works with valid signature and lsig (926 ms)
    addressoptOptIn
      ✓ works with valid lsig, method call, and sender (914 ms)
    setAddressOptInEndtime
      ✓ works with 0xffffffff as the end time (1001 ms)
      ✓ works with 0 as the end time (1611 ms)
```

## Reference Implementation
[delegated_optin_app.algo.ts](./contracts/delegated_optin_app.algo.ts) is the application written in TEALScript.

[DelegatedOptIn.approval.teal](./contracts/artifacts/DelegatedOptIn.approval.teal) is the TEAL compiled from TEALScript.

## Security Considerations

The test cases test proper functionality of all methods, but there has been no extended effort in attempt to break the contract. Most of the functionality in the app and logic signatures is relatively simple, so the chances of unexpected bugs is relatively low.

It should be made clear that signatures are stored mapped to the signer (`auth-addr`) and end times are mapped to the public Algorand address. This means when a signature is made known, every account with the signing account as the `auth-addr` can now be opted-in to assets via the delegated logic signature. Every account must set the end times to their desire, because without an end time set the signature will work regardless of the latest timestamp.

## Copyright
Copyright and related rights waived via <a href="https://creativecommons.org/publicdomain/zero/1.0/">CCO</a>.
