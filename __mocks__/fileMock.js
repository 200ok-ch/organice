// This is a workaround. We used to have CRA, now we have Parcel.

// We used to have the raw.macro for reading files, but that's a babel
// thing, so we had to switch for importing the parcel way. Now, that
// code works well, again. Having said so, jest (which uses babel)
// cannot read the files as parcel does. So we need a workaround.
// Luckily Jest is very powerful and has moduleNameMapper
// functionality where we defined in jest.config.json that we override
// imports with `bundle-text` and `url` prefixes to this stubbed file.

// Export a simple string stub.
module.exports = 'test-file-stub';
