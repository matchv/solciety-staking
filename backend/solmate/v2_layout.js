const BufferLayout = require("buffer-layout");
const {Connection, PublicKey, clusterApiUrl, Keypair} = require("@solana/web3.js");
const { config } = require('./v2_config');
const host_wallet = require('./host_wallet.json');

const connection = new Connection(
  clusterApiUrl(config.network),
  'confirmed',
);
const secretKey = Buffer.from(host_wallet);
const initAccount = Keypair.fromSecretKey(secretKey);
const host_pubkey = initAccount.publicKey;
const token_program_pubkey = new PublicKey(config.token_program_addr);

/**
 * =========Config head=============
 * is_initialized,          1 byte
 * init_pubkey,             32 bytes
 * ciety_pubkey,            32 bytes
 * ciety_mint_pubkey,       32 bytes
 * stake_program_pubkey,    32 bytes
 * gsdm_pubkey,             32 bytes
 * gcdm_pubkey,             32 bytes
 * rpdm_pubkey,             32 bytes
 * pwdm_size,               2 bytes
 * stake_min_days,          2 bytes
 * stake_max_days,          2 bytes
 * emission_total_days,     2 bytes
 * ciety_decimals,          1 byte
 * start_emission,          4 bytes
 * init_timestamp,          8 bytes
 * decay_frequency_seconds, 4 bytes
 * end_slot,                2 bytes
 * nft_author_cnt,          1 byte
 * total_nfts,              2 bytes
 * max_stake_per_wallet,    2 bytes
 * max_stake_each_time,     2 bytes
 * unstake_batch_size,      1 byte
 * ===below repeated===============
 * nft_author,              32 bytes
 */
const CONFIG = BufferLayout.struct([
  BufferLayout.u8('is_initialized'),
  BufferLayout.blob(32, 'init_pubkey'),
  BufferLayout.blob(32, 'ciety_pubkey'),
  BufferLayout.blob(32, 'ciety_mint_pubkey'),
  BufferLayout.blob(32, 'gsdm_pubkey'),
  BufferLayout.blob(32, 'gcdm_pubkey'),
  BufferLayout.blob(32, 'rpdm_pubkey'),
  BufferLayout.u16('pwdm_size'),
  BufferLayout.u16('stake_min_days'),
  BufferLayout.u16('stake_max_days'),
  BufferLayout.u16('emission_total_days'),
  BufferLayout.u8('ciety_decimals'),
  BufferLayout.u32('start_emission'),
  BufferLayout.nu64('init_timestamp'),
  BufferLayout.u32('decay_frequency_seconds'),
  BufferLayout.u16('end_slot'),
  BufferLayout.u8('nft_author_cnt'),
  BufferLayout.u16('total_nfts'),
  BufferLayout.u16('max_stake_per_wallet'),
  BufferLayout.u16('max_stake_each_time'),
  BufferLayout.u8('unstake_batch_size'),
]);

const CONFIG_REPEATED = BufferLayout.struct([
  BufferLayout.blob(32, 'nft_author'),
]);

exports.read_config = async () => {
  const config_pubkey = await PublicKey.createWithSeed(
      host_pubkey,
      config.seed_config,
      token_program_pubkey)
  const config_raw = (await connection.getAccountInfo(config_pubkey, 'confirmed')).data
  let config_dm = CONFIG.decode(config_raw)
  let rtn = {
      is_initialized: config_dm.is_initialized ? true : false,
      init_pubkey: new PublicKey(config_dm.init_pubkey).toString(),
      ciety_pubkey: new PublicKey(config_dm.ciety_pubkey).toString(),
      ciety_mint_pubkey: new PublicKey(config_dm.ciety_mint_pubkey).toString(),
      gsdm_pubkey: new PublicKey(config_dm.gsdm_pubkey).toString(),
      gcdm_pubkey: new PublicKey(config_dm.gcdm_pubkey).toString(),
      rpdm_pubkey: new PublicKey(config_dm.rpdm_pubkey).toString(),        
      pwdm_size: config_dm.pwdm_size,
      stake_min_days: config_dm.stake_min_days,
      stake_max_days: config_dm.stake_max_days,
      emission_total_days: config_dm.emission_total_days,
      ciety_decimals: config_dm.ciety_decimals,
      start_emission: config_dm.start_emission,
      init_timestamp: new Date(config_dm.init_timestamp * 1000).toISOString(),
      decay_frequency_seconds: config_dm.decay_frequency_seconds,
      end_slot: config_dm.end_slot,
      nft_author_cnt: config_dm.nft_author_cnt,
      total_nfts: config_dm.total_nfts,
      max_stake_per_wallet: config_dm.max_stake_per_wallet,
      max_stake_each_time: config_dm.max_stake_each_time,
      unstake_batch_size: config_dm.unstake_batch_size,
  }

  let ind = CONFIG.span
  rtn['nft_authors'] = []
  for (var i = 0; i < rtn.nft_author_cnt; i++) {
      let slice = config_raw.slice(ind, ind + CONFIG_REPEATED.span)
      let auth_pubkey = new PublicKey(CONFIG_REPEATED.decode(slice).nft_author)
      rtn['nft_authors'].push(auth_pubkey.toString())
      ind = ind + CONFIG_REPEATED.span
  }

  ind = CONFIG.span + 10 * CONFIG_REPEATED.span
  let obj = {ind:ind, raw:config_raw}
  let seed_pwdm = next_string(obj)
  let seed_pda_ciety = next_string(obj)
  let seed_pda_nft = next_string(obj)
  rtn['seed_pwdm'] = seed_pwdm
  rtn['seed_pda_ciety'] = seed_pda_ciety
  rtn['seed_pda_nft'] = seed_pda_nft

  config_dm = rtn
  return rtn
}

const next_string = (obj) => {
  let len = obj.raw.slice(obj.ind, obj.ind + 1)[0]
  obj.ind = obj.ind + 1
  let str = obj.raw.slice(obj.ind, obj.ind + len).toString()
  obj.ind = obj.ind + len
  return str
}