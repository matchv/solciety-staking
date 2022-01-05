const TOTAL_NFTS = 7000;
/**
 * ==========================================
 * Gcdm data layout:
 * ==========================================
 * is_initialized,   1 byte
 * last_stake_slot,  2 bytes
 * last_calc_slot,   2 bytes
 * global_nft_count, 2 bytes
 * 
 * ======the following is repeated per nft===========
 * nft_ciety,  8 bytes
 * start_slot, 2 bytes
 * end_slot,   2 bytees
 */
const GCDM_SIZE = 84005; // = 1 + 2 + 2 + (8 + 2 + 2) * 7000

/**
 * ==========================================
 * Gsdm data layout:
 * ==========================================
 * is_initialized, 1 byte
 * 
 * ======the following is repeated per slot===
 * nft_count,    2 bytes
 * nft_last_ind, 2 bytes
 * nft_nth,      1 byte, 7000 bytes in total
 */
const GSDM_SIZE = 2556461; // for 365 days, = 1 + 365 * (2 + 2 + 7000 * 1)

/**
 * ==========================================
 * Rpdm data layout:
 * ==========================================
 * is_initialized, 1 byte
 * count_to_calc,  2 bytes
 * ===below repeated==
 * slot_nth,       2 bytes
 * nft_nth,        2 bytes
 */
const RPDM_SIZE = 1463; // for 365 days, = 1 + 2 + 365 * (2 + 2)

/**
 * =========Config head=============
 * is_initialized,          1 byte
 * init_pubkey,             32 bytes
 * ciety_pubkey,            32 bytes
 * ciety_mint_pubkey,       32 bytes
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
const CONFIG_SIZE = 608; // = sum(head bytes) + 10 * 32, max authorities are 10

/**
 * is_initialized, 1 byte
 * ciety,          8 bytes
 * nft_count,      2 bytes
 * unstake_start,  2 bytes
 * ===below repeated==
 * nft_account,      32 bytes
 * nft_pda,          32 bytes
 * nft_n_th,         2 bytes
 * start_timestamp,  8 bytes
 * time_length_days, 2 bytees
 */
const MAX_STAKE_PER_WALLET = 100;
const PWDM_SIZE = 7609; // = 1 + 8 + 2 + 2 + (32 + 32 + 2 + 8 + 2) * MAX_STAKE_PER_WALLET
//=======================DO NOT TOUCH THE ABOVE=========================================
exports.config = {
    network: 'devnet',

    // Redeploy a Solana program doesn't need to change these addresses,
    // but you can if needed
    stake_program_addr: 'FJ5r8jcXxi6tAVB1vQymSQ59VWLvyb9YmbKLyvViSFqs',
    token_program_addr: 'EMBJ18voW7SUw2DFJRwSa7FrFVD45oU7vqqkpNWm2aa2',

    gsdm_size: GSDM_SIZE,
    gcdm_size: GCDM_SIZE,
    rpdm_size: RPDM_SIZE,
    pwdm_size: PWDM_SIZE,
    config_size: CONFIG_SIZE,

    // if you want to replay for some reasons, you need to change the number suffix
    // and re-initialize, they are used to derive keys for accounts from host or staker wallet
    seed_config: 'seed_config_37',
    seed_ciety: 'seed_ciety_37',
    seed_gsdm: 'seed_gsdm_37',
    seed_gcdm: 'seed_gcdm_37',
    seed_pwdm: 'seed_pwdm_37',
    seed_rpdm: 'seed_rpdm_37',

    // you don't need to change these two, they affect nothing even re-initializing
    seed_pda_ciety: 'ciety_escrow',
    seed_pda_nft: 'nft_escrow',
    
    // $CIETY distribution in the begining is performed off-chain, since it's one time job.
    // but, the remaining is locked on-chain with an account owned by the smart contract
    total_supply: 1000000000,
    to_community_percent: 0.2,
    to_community_address: 'AJz6nffDtCBtquZj4gSHMj9YjHDhETZe2RpA2S9Pfqf4',
    to_team_percent: 0.05,
    to_team_addresses: ['DnUspL6hJpp7edGF2LGt4vSEUwttYxvVR3LtuEHs3QM8', '2qwZumjVu8CCasFHxL31YhzrMwN3ubkM8XzupGxPZ6u1'],
    to_rewards_percent: 0.75,

    stake_min_days: 7,
    stake_max_days: 365,
    emission_total_days: 365 * 2,
    ciety_decimals: 9,
    start_emission: 100000,
    decay_frequency_seconds: 24 * 3600,
    total_nfts: TOTAL_NFTS,
    max_stake_per_wallet: MAX_STAKE_PER_WALLET,
    max_stake_each_time: 5, // don't touch this, because Solana has transaction size limit
    unstake_batch_size: 4,  // don't touch this, because Solana has transaction size limit
    
    // Multiple mint authorities are allowed, but max 10
    nft_authors: ['9MJzW1oEzvjHnmdLdoGRGr1i4hu82g7eEEnxvmifcDZD']
    
}