The goal of this ARC is to allow asset transfers without the receiver having to explicitly opt-in first.

# Warning 
None of this code is tested. Right now it simply serves as a proof of concept.

# Files
[optin_lsig.teal](./contracts/optin_lsig.teal) is a logic signature intended to be signed by the receiver so that another party can opt them into assets. [app.algo.ts](./contracts/app.algo.ts) is a application that allows users to whitelist which addresses are allowed to opt them in. There is also a method that stores the signature of the lsig for a given user in a box, which is verified via [verifier.teal](./contracts/verifier.teal).

[deploy.ts](./deploy.ts) is used to deploy the contracts on a localnetwork.