export const config = {
    network_url: 'https://api.devnet.solana.com', // only for getting NFT metadata via HTTP API
    network: 'devnet',

    stake_program_addr: 'FJ5r8jcXxi6tAVB1vQymSQ59VWLvyb9YmbKLyvViSFqs',
    token_program_addr: 'EMBJ18voW7SUw2DFJRwSa7FrFVD45oU7vqqkpNWm2aa2',
    host_wallet_addr: '9MJzW1oEzvjHnmdLdoGRGr1i4hu82g7eEEnxvmifcDZD',

    // if you want to replay for some reasons, you need to change the number suffix
    // and re-initialize, these must be the same as those in backend configuration,
    // they are used to derive keys for accounts from host wallet address
    seed_config: 'seed_config_37',
    
    total_nfts: 7000,
};
