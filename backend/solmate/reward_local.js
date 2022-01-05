
const redis = require('redis')
const rdsClient = redis.createClient({
    // host:'172.31.98.90',
    // port: 6379
});
const config = require('./config')

var connected = false

function conn() {
    rdsClient.on('error', (err) => {
        log.log("error", err)
        console.log('Redis Client Error', err)
    })
    await rdsClient.connect()
    connected = true;
    console.log("Connecting Redis.......connected")
}

const KEY_STATES = 'KEY_STATES';
const KEY_LOCK = 'LOCK';
const RESP_OK = 'OK';
const RESP_ERR = 'ERR';

function utc() {
    var date = new Date
    var now = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()) / 1000)
    return now
}

function calc_slot(now, decay_frequency_seconds, init_timestamp) {
    let rtn = (now - init_timestamp) / (decay_frequency_seconds);
    return parseInt(rtn);
}

function calc_emit (init_value, start_slot, curr_slot, total_slots){
    let elapsed = curr_slot - start_slot + 1;
    let rtn = init_value * (total_slots - elapsed)/(total_slots);
    return rtn;
}

async function get_states() {
    try{
        let rds_states = await rdsClient.get(KEY_STATES);
        let acc_stake_state_info = {};
        if (rds_states) {
            acc_stake_state_info = JSON.parse(rds_states);
        } else {
            acc_stake_state_info = {
                is_initialized: true,
                len: 0,
                last_slot: 0,
                staked: {}
            };
        }
        return acc_stake_state_info;
    }catch(err){
        log.log(err);
        console.log(err);
        return RESP_ERR;
    }
}

async function save_states(acc_stake_state_info){
    try{
        await rdsClient.set(KEY_STATES, JSON.stringify(acc_stake_state_info));
        return RESP_OK;
    }catch(err){
        log.log(err);
        console.log(err);
        return RESP_ERR;
    }
}

async function lock(){
    try{
        let ok = 0;
        while(ok == 0){
            ok = await rdsClient.setNX(KEY_LOCK, '1');
        }
        return RESP_OK;
    }catch(err){
        log.log(err);
        console.log(err);
        return RESP_ERR;
    }
}

async function un_lock(){
    try{
        await rdsClient.del(KEY_LOCK);
        return RESP_OK;
    }catch(err){
        log.log(err);
        console.log(err);
        return RESP_ERR;
    }
}

exports.reward_local = async (req, res) => {
    try{
        let {staker_wallet} = req.body;
        if (!connected) conn()
    
        // 1. get a lock
        let rtn_lock = lock();
        if(rtn_lock == RESP_ERR){
            res.json({state:RESP_ERR});
            return;
        }
    
        // 2. destructure config to be prepared for calculating reward
        let { decay_frequency_seconds, init_timestamp, start_emission } = config;
        let ciety_end_slot = end_slot;
    
        // 3. get utc timestamp and calculated current slot
        let now = utc();
        let curr_slot = calc_slot(now, decay_frequency_seconds, init_timestamp);
    
        // 4. get stake info
        let acc_stake_state_info = get_states();
        if(acc_stake_state_info.staked.length==0){
            res.json({state:RESP_OK, total_reward:0, nfts:[]});
            return;
        }
    
        // 5. update all NFTs' accumulated_ciety
        let {
            is_initialized,
            len,
            last_slot,
            staked,
        } = acc_stake_state_info;
        let total_reward = 0;
        for (var slot = last_slot; slot <= curr_slot; slot++) {
            let ciety = calc_emit(start_emission, 0, slot, ciety_end_slot + 1);
            // 5.1 calculate total veNFT per time slot
            let total_venft = 0;
            for (const [wallet, nfts] of Object.entries(staked)) {
                nfts.forEach(nft => {
                    let {
                        nft_account,
                        pda,
                        start_timestamp,
                        time_length_day,
                        accumulated_ciety,
                        start_slot,
                        end_slot,
                    } = nft;
    
                    // expired
                    if (curr_slot > end_slot || curr_slot < start_slot) {
                        continue;
                    }
    
                    let nft_total_slots = end_slot - start_slot + 1;
                    let venft_start = (nft_total_slots) / ((ciety_end_slot + 1));
                    let venft = calc_emit(venft_start, start_slot, slot, nft_total_slots);
                    total_venft += venft;
                })
            }
    
            // 5.2 Calculate $CIETY per NFT
            for (const [wallet, nfts] of Object.entries(staked)) {
                nfts.forEach(nft => {
                    let {
                        nft_account,
                        pda,
                        start_timestamp,
                        time_length_day,
                        accumulated_ciety,
                        start_slot,
                        end_slot,
                    } = nft;
    
                    // expired
                    if (curr_slot > end_slot || curr_slot < start_slot) {
                        continue;
                    }
    
                    // update accumulated_ciety of a specific NFT
                    let nft_total_slots = end_slot - start_slot + 1;
                    let venft_start = (nft_total_slots) / ((ciety_end_slot + 1));
                    let venft = calc_emit(venft_start, start_slot, slot, nft_total_slots);
                    let share = (venft) / (total_venft);
                    nft.accumulated_ciety += share * ciety;

                    // add this staker's total rewards
                    if(wallet == staker_wallet){
                        total_reward = total_reward + nft.accumulated_ciety;
                    }
                })
            }
        }
    
        // 6. update last_slot of states
        acc_stake_state_info.last_slot = curr_slot;
    
        // 7. save states
        let rtn_save_states = save_states(acc_stake_state_info);
        if(rtn_save_states == RESP_ERR){
            res.json({state:RESP_ERR});
            return;
        }

        // 8. unlock
        let rtn_un_lock = un_lock();
        if(rtn_un_lock == RESP_ERR){
            res.json({state:RESP_ERR});
            return;
        }

        // 9. update on-chain data
        

        // 10. return
        res.json({state:RESP_OK, total_reward:total_reward, nfts: staked[staker_wallet]});
        return;

    }catch(err){
        log.log(err);
        console.log(err);
        res.json({state:RESP_ERR});
        return;
    }
}


