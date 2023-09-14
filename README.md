## Abstract
This ARC contains is an implementation of [ARCX](https://github.com/algorandfoundation/ARCs/pull/229). The goal is to provide users a way to delegate asset opt-ins while having a high degree of control compared to a standalone logic signature without an application. The expectation is that a single instance of this ARC will be deployed on Algorand networks. 

## Motivation
[ARCX](https://github.com/algorandfoundation/ARCs/pull/229) provides a standard for delegated asset opt-ins, but there are some UX problems that need to be addressed. First, there needs to be a way to control whether the lsig is still functional or not. Without an application to control this, signing the logic signature program would be irreversible without rekeying. There also needs to be a standardized way to store and read signatures for a given account so dApps and other users can take advantaged of delegated opt-ins.

## Specification
This is an implementation of [ARCX](https://github.com/algorandfoundation/ARCs/pull/229). There is additional functionality provided by the application in this ARC in the methods of the application.

For all methods, refer to the [ABI JSON description](./contracts/artifacts/DelegatedOptIn.abi.json) for complete descriptions of arguments.

### Signature Storage

`setSignature(byte[64],pay)void` is a method that allows a user to upload their signature to box storage


### Opt-In

`delegatedOptIn(pay,axfer)void` is an implementation of the [ARCX](https://github.com/algorandfoundation/ARCs/pull/229) interfaces. It verifies the MBR payment is sent to the account opting in and that it covers the ASA minimum balance requirement.

### Storage

| Type | Key | Description |
| ---- | --- | ----------- |
| Box | `auth-addr \|\| address` | Mapping of signer to lsig signature |

## Rationale
Box storage is used to store signatures to make them easily accessible for any user or app wishing to use them and act as a way to signify if delegated opt-ins should be allowed.

## Backwards Compatibility
N/A

## Test Cases
Tests written with Jest and algokit for the contract and logic signatures can be seen in [test.ts](./tests/test.ts).

```
  Delegated Opt In App
    create
      ✓ creates the app (765 ms)
    setSignature
      ✓ works with valid signature and lsig (790 ms)
    delegatedOptIn
      ✓ works with valid lsig and method call (1453 ms)
    revokeSignature
      ✓ sends back MBR (753 ms)
      ✓ doesn't allow opt-ins (1186 ms)
```

## Reference Implementation
[delegated_optin_app.algo.ts](./contracts/delegated_optin_app.algo.ts) is the application written in TEALScript.

[DelegatedOptIn.approval.teal](./contracts/artifacts/DelegatedOptIn.approval.teal) is the TEAL compiled from TEALScript.

## Security Considerations

The test cases test proper functionality of all methods, but there has been no extended effort in attempt to break the contract. Most of the functionality in the app and logic signatures is relatively simple, so the chances of unexpected bugs is relatively low.

It should be made clear that signatures are stored mapped to the signer (`auth-addr || address`). This means when a signature is made known, every account with the signing account as the `auth-addr` can now be opted-in to assets via the delegated logic signature.

## Copyright
Copyright and related rights waived via <a href="https://creativecommons.org/publicdomain/zero/1.0/">CCO</a>.
