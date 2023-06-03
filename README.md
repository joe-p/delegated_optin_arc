The goal of this ARC is to allow asset transfers without the receiver having to explicitly opt-in first.

# Warning 
None of this code is tested. Right now it simply serves as a proof of concept.

# Processes

## Definitions

**DYANMO_DB** - A centralized server containing a mapping of addresses to signatures

**OPT_IN_PROGRAM** - The logic for the logic signature that can opt into assets

**OPT_IN_SIGNATURE** - The signature of **OPT_IN_PROGRAM** used for delegated opt-ins

**MASTER_APP** - A single app deployed on an Algorand network used for storing signatures and verifying delegated opt-ins

**VERIFIER_LSIG** - An lsig whos sole purpose is to verify a given **OPT_IN_SIGNATURE** against the authorization address of a given account

**ALLOWLIST_APP** - A single app deployed on an Algorand network used for only allowing certain addresses to opt them into assets

## Wallet Onboarding
This is the process for onboarding new users in a wallet (ie. Defly, Pera).

### Transaction Group
None

### Steps

1. Wallet generates keypair as per usual
2. Wallet prompts user if they want to enable deletgated opt-ins
3. If yes, the wallet will sign the standardized lsig with the generated sk
   1. This can be a single click
4. Wallet sends address and lsig signature to **DYANMO_DB**

## On-Chain Signature Storage
This is the process for a user adding their **OPT_IN_SIGNATURE** to box strorage of the master contract. This can be done at any time by any account.

### Transaction Group

1. MBR Payment: Payent to **MASTER_APP** to cover cost of storing **OPT_IN_SIGNATURE** in a box 
2. **VERIFIER_LSIG**: Any type of transaction from **VERIFIER_LSIG**
3. **MASTER_APP**: `setSignature`
   1. *sig* - **OPT_IN_SIGNATURE**
   2. *acct* - The account for which we are adding the **OPT_IN_SIGNATURE**
   3. *authAddr* - The auth address of the aforementioned account

### Steps

1. Any account calls `setSignature` in **MASTER_APP** with the above arguments (including atomic txn from **VERIFIER_LSIG**)
2. **MASTER_APP** stores a box whose key is the address and value is the **OPT_IN_SIGNATURE**

## Setting Allowlist

This is the process for setting an allowlist to only allow specific address to opt you into assets

### Transaction Group
**Note**: These all *could* be done seperately

1. **ALLOWLIST_APP**: `setAllowlist`
   1. *boxID* - A single account can have multiple allowlists split across multiple boxes, so this uint64 indentifies which allowlist to set
   2. *addrs* - A dynamic array of address to allow delegated opt-ins
2. **ALLOWLIST_APP**: `setAllowlistStatus`
   1. *status* - A uint8 that is either 0 for allowing all opt-ins, 1 for allowing only allowlisted accounts to opt in, or 2 for allowing no opt ins
3. **MASTER_APP**: `setVerificationMethods`
   1. *methods* - `[ALLOWLIST_APP appID, 0x30cec2f8]` `0x30cec2f8` is the method selector for `setVerificationMethods((application,string)[])void`

## Delegated Opt-In (No Allowlist)

This is the process for initiating a delegated opt in for an account that has not set or enabled allowlists.

The **OPT_IN_SIGNATURE** can be read from either **DYNAMO_DB** or **MASTER_APP**

### Transaction Group
1. MBR Payment - A payment transaction from the sender to the account opting in that covers the ASA MBR (0.1 ALGO)
2. Opt In - A opt-in transaction signed by **OPT_IN_SIGNATURE**
3. **MASTER_APP**: verify
   1. *verificationTxnIndex* - Not used
   2. *verifcationMethodIndex* - Not used

## Delegated Opt-In (With Allowlist)

This is the process for initiating a delegated opt in for an account that has a set allowlist

The **OPT_IN_SIGNATURE** can be read from either **DYNAMO_DB** or **MASTER_APP**

### Transaction Group
1. **ALLOWLIST_APP**: `verifySender`
   1. *boxID* - uint16 identifying the box the sender address is contained in
   2. *index* - uint64 which is the index of the sender address in the box
2. MBR Payment - A payment transaction from the sender to the account opting in that covers the ASA MBR (0.1 ALGO)
3. Opt In - A opt-in transaction signed by **OPT_IN_SIGNATURE**
4. **MASTER_APP**: verify
   1. *verificationTxnIndex* - 0
   2. *verifcationMethodIndex* - 0