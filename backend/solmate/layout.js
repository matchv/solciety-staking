const BufferLayout = require("buffer-layout");

/**
 * Layout for a public key
 */
const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
const uint64 = (property = "uint64") => {
  return BufferLayout.blob(8, property);
};


exports.CONFIG_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("is_initialized"),
  publicKey("init_pubkey"),
  BufferLayout.u16('stake_min_days'),
  BufferLayout.u16('stake_max_days'),
  BufferLayout.u16('emission_total_days'),
  BufferLayout.u8("ciety_decimals"),
  BufferLayout.u32('start_emission'),
  BufferLayout.blob(8, 'init_timestamp'),
  BufferLayout.u32('decay_frequency_seconds'),
  BufferLayout.u32('end_slot'),
]);