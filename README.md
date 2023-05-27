The goal of this ARC is to allow asset transfers without the receiver having to explicitly opt-in first.

[optin_lsig.teal](./contracts/optin_lsig.teal) is a logic signature intended to be signed by the receiver so that another party can opt them into assets. [app.algo.ts](./contracts/app.algo.ts) is a application that allows users to whitelist which addresses are allowed to opt them in. Also stores the signature in a box, which is verified via [verifier.teal](./contracts/verifier.teal). All three must be called/used atomically, as per the `verifySender` method signature.

[deploy.ts](./deploy.ts) is used to deploy the contracts on a localnetwork.