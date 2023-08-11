// Typically this could have extension of ethers Signer class implemented in very custom way - for each validation/auth module
// examples could be PassKeySigner, ECDSASigner, SessionSigner, etc.
// they would have getAddress, custom members, signMessage etc implemented in specific way with needful helpers.

// Another addition might be high level BiconomySmartAccountSigner and BiconomySmartAccountProvider classes which wraps everything and abstracts away initialisation based on mere config
// Then those can be used to init ethers contract instance and intercept tx methods to build and dispatch userop
// providers could come in here or separate package can be made
// Any widgets and helpers specific to session key and pass key can be added in separate package