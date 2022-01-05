use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    system_instruction,
    log::sol_log_compute_units,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
    instruction::{AccountMeta, Instruction},
};
use spl_associated_token_account::{create_associated_token_account, get_associated_token_address};
use spl_token::state::{Account as TokenAccount, Mint};
use spl_token_metadata::{
    instruction::{create_metadata_accounts, update_metadata_accounts},
    state::{Data, Metadata, PREFIX},
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use std::{iter::Cycle};
use std::convert::TryInto;
use std::rc::Rc;
use crate::{
    v2_error::SolmateStakeError,
    v2_instruction::SolmateInsV2,
    v2_state::{ Pwdm, Gcdm, Gsdm, Rpdm},
};
use solmate_program_token::v2_error::{SolmateCommonError};
use solmate_program_token::{v2_state::ConfigDM};
use solmate_program_token::v2_instruction::SolmateInsV2::InsTransferCiety;

pub struct Processor;
impl Processor {
    
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = SolmateInsV2::unpack(instruction_data)?;
        match instruction {
            SolmateInsV2::InsStake { time_length_days, nft_num } => {
                Self::process_stake(accounts, time_length_days, nft_num, program_id)
            }
            SolmateInsV2::InsRewardCalc {start, end, slot}  => Self::process_reward_calc(accounts, program_id, start, end, slot),
            SolmateInsV2::InsRewardView {} => Self::process_reward_view(accounts, program_id),
            SolmateInsV2::InsRewardClaim {} => Self::process_reward_claim(accounts, program_id),
            SolmateInsV2::InsUnstake {} => Self::process_unstake(accounts, program_id),
            SolmateInsV2::InsAddTiemLength {time_length_days} => Self::process_increase_time_length(accounts, time_length_days, program_id),
            SolmateInsV2::InsRewardPrep {curr_slot} => Self::process_reward_prep(accounts, curr_slot, program_id),
            SolmateInsV2::InsCheckExpiration {} => Self::process_check_expiration(accounts, program_id),
            
        }
    }

    fn process_check_expiration(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Check_expiration 1] Resolve accounts");
        let account_iter = &mut accounts.iter();        
        let acc_init = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;

        // 2. Load config
        msg!("[Check_expiration 2] Load config");
        let config_raw = acc_config.data.borrow();
        let proj_config = ConfigDM::unpack_unchecked(&config_raw)?;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Pwdm
        msg!("[Check_expiration 3] Load Pwdm");
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;

        // 4. Load Gcdm
        msg!("[Check_expiration 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;
        
        // 5. Check each NFT's expiration
        msg!("[Check_expiration 5] Check each NFT's expiration and calculate reward"); 
        let clock = Clock::get()?;
        let mut a:[u8;2] = [0u8;2];
        let mut b:[u8;8] = [0u8;8];
        let mut reward = Self::calc_reward_per_wallet(pwdm.nft_count, &pwdm_raw, &gcdm_raw);
        for ind in 0..pwdm.nft_count {
            // 5.1 Resolve nft_nth
            let nft_nth = Self::pwdm_decode_nft_nth(ind, &pwdm_raw, &mut a);

            // 5.2 Resolve start and end slot
            let (start_slot, end_slot) = Self::gcdm_decode_slot_interval(nft_nth, &mut gcdm_raw, &mut b, &mut a);

            // 5.5 Check if really expired
            let end_time = proj_config.init_timestamp + ((end_slot - start_slot) as u32 * proj_config.decay_frequency_seconds) as i64;
            if(end_time > clock.unix_timestamp){                
                return Err(SolmateStakeError::StakingNotFinished.into());
            }
        }
        
        // 6.  Save Pwdm
        msg!("[Check_expiration 6] Save Pwdm");
        pwdm.ciety = reward as f64 / u64::pow(10, proj_config.ciety_decimals as u32) as f64;
        Pwdm::pack(pwdm, &mut pwdm_raw)?;

        msg!("[Check_expiration 7] Done!");
        Ok(())
    }

    fn process_reward_prep(
        accounts: &[AccountInfo],
        curr_slot: u16,
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Reward_Prep 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_rpdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;

        // 2. Load Config
        msg!("[Reward_Prep 2] Load Config");
        let mut config_raw = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&config_raw)?;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_rpdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_gsdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Rpdm
        msg!("[Reward_Prep 3] Load Rpdm"); 
        if acc_rpdm.data.borrow()[0] == 0 {
            Self::check_rent(acc_rent, acc_rpdm, SolmateStakeError::RpdmNotRentExempted);
            Self::check_size(acc_rpdm, Rpdm::LEN, SolmateStakeError::RpdmAccountWrongSize);
        }
        let mut rpdm_raw = acc_rpdm.data.borrow_mut();
        let mut rpdm = Rpdm::unpack_unchecked(&rpdm_raw)?;
        let Rpdm{
            ref mut is_initialized,
            ref mut count_to_calc,
        }=rpdm;
        if !*is_initialized {
            *is_initialized = true;
        }

        // 4. Load Gcdm
        msg!("[Reward_Prep 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;

        // 5. Load Gsdm
        msg!("[Reward_Prep 5] Load Gsdm");
        let mut gsdm_raw = acc_gsdm.data.borrow_mut();

        // 6. Update Rpdm
        msg!("[Reward_Prep 6] Update Rpdm");
        let mut total_slots_to_calc = 0u16;
        let start_slot = if gcdm.last_calc_slot == 9999 {0} else {gcdm.last_calc_slot + 1};
        let start_slot = start_slot as usize;
        for slot in start_slot..curr_slot as usize {
            let nft_count = Self::gsdm_decode_nft_count(&mut gsdm_raw, slot as u16, proj_config.total_nfts);
            if(nft_count == 0){
                continue;
            }
            // accumulated counts of slots to be calculated
            total_slots_to_calc = total_slots_to_calc + 1;

            let nft_last_ind = Self::gsdm_decode_nft_last_ind(&mut gsdm_raw, slot as u16, proj_config.total_nfts);

            let rpdm_ind = Rpdm::NEXT_IND + (total_slots_to_calc as usize - 1) * Rpdm::REPEATED_SIZE;
            let slot_nth_bytes = slot.to_le_bytes();
            rpdm_raw[rpdm_ind]     = slot_nth_bytes[0];
            rpdm_raw[rpdm_ind + 1] = slot_nth_bytes[1];

            let nft_last_ind_bytes = nft_last_ind.to_le_bytes();
            rpdm_raw[rpdm_ind + 2] = nft_last_ind_bytes[0];
            rpdm_raw[rpdm_ind + 3] = nft_last_ind_bytes[1];
        }
        *count_to_calc = total_slots_to_calc;

        // 7.  Save Rpdm
        msg!("[Reward_Prep 7] Save Rpdm");
        Rpdm::pack(rpdm, &mut rpdm_raw)?;

        // 8.  Save Gcdm
        msg!("[Reward_Prep 8] Save Gcdm, avoid scaning long empty slot gaps");
        if(total_slots_to_calc == 0){
            gcdm.last_calc_slot = curr_slot - 1;
        }
        Gcdm::pack(gcdm, &mut gcdm_raw)?;

        msg!("[Reward_Prep 9] Done!");
        Ok(())
    }

    fn process_reward_claim(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Reward_claim 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_ciety = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_staker = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;
        let acc_ciety_receiver = next_account_info(account_iter)?;
        let acc_ciety_mint = next_account_info(account_iter)?;
        let acc_ciety_pda = next_account_info(account_iter)?;
        
        // 2. Load Config
        msg!("[Reward_claim 2] Load Config");
        let config_raw = acc_config.data.borrow();
        let proj_config = ConfigDM::unpack_unchecked(&config_raw)?;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Pwdm
        msg!("[Reward_claim 3] Load Pwdm");
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;

        // 4. Load Gcdm
        msg!("[Reward_claim 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;

        // 5. Zero $CIETY in Pwdm & Gcdm
        msg!("[Reward_claim 5] Zero $CIETY in Pwdm & Gcdm"); 
        let total_ciety = Self::calc_reward_per_wallet(pwdm.nft_count, &pwdm_raw, &gcdm_raw);
        Self::zero_ciety_per_wallet(pwdm.nft_count, &mut pwdm_raw, &mut gcdm_raw);
        pwdm.ciety = 0f64;

        // 6. Transfer $CIETY to staker
        msg!("[Reward_claim 6] Transfer $CIETY to staker");
        let data = InsTransferCiety{amount: total_ciety}.pack();
        let ins = Instruction::new_with_bytes(
            *acc_solmate_token_prog.key,
            &*data, 
            vec![
                AccountMeta::new(*acc_init.key, true),
                AccountMeta::new(*acc_ciety.key, false),
                AccountMeta::new(*acc_ciety_receiver.key, false),
                AccountMeta::new_readonly(*acc_ciety_pda.key, false),
                AccountMeta::new_readonly(*acc_token_prog.key, false),
                AccountMeta::new_readonly(*acc_ciety_mint.key, false),
                AccountMeta::new_readonly(*acc_config.key, false),
            ]);
        invoke(
            &ins,
            &[
                acc_init.clone(),
                acc_ciety.clone(),
                acc_ciety_receiver.clone(),
                acc_ciety_pda.clone(),
                acc_token_prog.clone(),
                acc_ciety_mint.clone(),      
                acc_config.clone(),  
            ]
        )?;

        // 7.  Save Pwdm
        msg!("[Reward_claim 7] Save Pwdm"); 
        Pwdm::pack(pwdm, &mut pwdm_raw)?;

        // 8.  Save Gsdm
        msg!("[Reward_claim 8] Save Gcdm"); 
        Gcdm::pack(gcdm, &mut gcdm_raw)?;

        msg!("[Reward_claim 9] Done!"); 
        Ok(())
    }

    fn process_reward_view(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {

        // 1. Resolve accounts
        msg!("[Reward_view 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;

        // 2. Load Config
        msg!("[Reward_view 2] Load Config");
        let mut config_raw = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&config_raw)?;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Pwdm
        msg!("[Reward_view 3] Load Pwdm");
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;

        // 4. Load Gcdm
        msg!("[Reward_view 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();

        // 5. Update Pwdm
        msg!("[Reward_view 5] Update Pwdm"); 
        let total_ciety = Self::calc_reward_per_wallet(pwdm.nft_count, &pwdm_raw, &gcdm_raw);
        pwdm.ciety = total_ciety as f64 / u64::pow(10, proj_config.ciety_decimals as u32) as f64;

        // 6.  Save Pwdm
        msg!("[Reward_view 6] Save Pwdm"); 
        Pwdm::pack(pwdm, &mut pwdm_raw)?;

        msg!("[Reward_view 7] Done!"); 
        Ok(())
    }

    fn process_stake(
        accounts: &[AccountInfo],
        time_length_days: u16,
        nft_num: u16,
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Stake 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_staker = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;

        let clock = Clock::get()?;

        // 2. Load Config
        msg!("[Stake 2] Load Config");
        let mut config_raw = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&config_raw)?;
        let total_nfts_usize = proj_config.total_nfts as usize;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_gsdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        if nft_num > proj_config.max_stake_each_time {
            return Err(SolmateStakeError::ExceedMaxNftEachTime.into());
        }

        if time_length_days < proj_config.stake_min_days {
            return Err(SolmateStakeError::TimeLengthTooShort.into());
        }
        if time_length_days > proj_config.stake_max_days {
            return Err(SolmateStakeError::TimeLengthTooLong.into());
        }

        // 3. Load Pwdm
        msg!("[Stake 3] Load Pwdm");
        if acc_pwdm.data.borrow()[0] == 0 {
            Self::check_rent(acc_rent, acc_pwdm, SolmateStakeError::PwdmNotRentExempted);
            Self::check_size(acc_pwdm, Pwdm::LEN, SolmateStakeError::PwdmAccountWrongSize);
        }
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;
        let Pwdm {
            ref mut is_initialized,
            ciety,
            ref mut nft_count,
            unstake_start
        } = pwdm;
        if !*is_initialized {
            *is_initialized = true;
        }
        
        if(*nft_count + nft_num > proj_config.max_stake_per_wallet){
            return Err(SolmateStakeError::ExceedMaxStakePerWallet.into());
        }

        // 4. Load Gcdm
        msg!("[Stake 4] Load Gcdm"); 
        if acc_gcdm.data.borrow()[0] == 0 {
            Self::check_rent(acc_rent, acc_gcdm, SolmateStakeError::GcdmNotRentExempted);
            Self::check_size(acc_gcdm, Gcdm::LEN, SolmateStakeError::GcdmAccountWrongSize);
        }
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;
        let Gcdm{
            ref mut is_initialized,
            last_calc_slot,
            ref mut global_nft_count
        }=gcdm;
        if !*is_initialized {
            *is_initialized = true;
        }

        // 5. Load Gsdm
        msg!("[Stake 5] Load Gsdm");
        if acc_gsdm.data.borrow()[0] == 0 {
            Self::check_rent(acc_rent, acc_gsdm, SolmateStakeError::GsdmNotRentExempted);
            Self::check_size(acc_gsdm, Gsdm::LEN, SolmateStakeError::GsdmAccountWrongSize);
        }
        let mut gsdm_raw = acc_gsdm.data.borrow_mut();
        let mut gsdm = Gsdm::unpack_unchecked(&gsdm_raw)?;
        let Gsdm{
            ref mut is_initialized,
        }=gsdm;
        if !*is_initialized {
            *is_initialized = true;
        }

        
        // 6. Calculate start_slot and end_slot of staked NFTs
        msg!("[Stake 6] Calculate start_slot and end_slot of staked NFTs");
        let now = clock.unix_timestamp;
        let now_bytes = now.to_le_bytes();
        let start_slot = Self::calc_slot(now, proj_config.decay_frequency_seconds, proj_config.init_timestamp);
        let end_slot = start_slot + time_length_days;

        // 7. Update Gsdm and Gcdm
        msg!("[Stake 7] Update Gsdm and Gcdm");
        let mut acc_tmp_nft:Option<AccountInfo<'_>> = None;
        let mut acc_tmp_mint:Option<AccountInfo<'_>> = None;
        let mut acc_tmp_pda:Option<AccountInfo<'_>> = None;
        let mut ind = 0usize;
        let mut a:[u8;2] = [0u8;2];
        let time_length_days_bytes = time_length_days.to_le_bytes();
        while let Some(acc) = account_iter.next() {
            let r = ind % 4;
            if r == 0 {
                acc_tmp_nft = Some(acc.clone());
            }else if r == 1 {
                acc_tmp_mint = Some(acc.clone());
            }else if r == 2 {
                acc_tmp_pda = Some(acc.clone());
            }else if r == 3 {
                let mut valid_author = false;
                for author in &proj_config.nft_authors {
                    if *acc.key == *author {
                        valid_author = true;
                        break;
                    }
                }
                if(!valid_author){                    
                    return Err(SolmateStakeError::NFTWrongAuthority.into());
                }

                // 8.0 Update Gcdm.global_nft_count
                *global_nft_count = *global_nft_count + 1;
                let global_nft_count_bytes = ((*global_nft_count - 1) as u16).to_le_bytes();

                // 8.1 Update Gcdm, start_slot, end_slot
                let gcdm_ind = Gcdm::NEXT_IND + 8 + (*global_nft_count - 1) as usize * Gcdm::REPEATED_SIZE;
                let start_slot_bytes = (start_slot as u16).to_le_bytes();
                let end_slot_bytes   = (end_slot as u16).to_le_bytes();
                gcdm_raw[gcdm_ind]     = start_slot_bytes[0];
                gcdm_raw[gcdm_ind + 1] = start_slot_bytes[1];
                gcdm_raw[gcdm_ind + 2] = end_slot_bytes[0];
                gcdm_raw[gcdm_ind + 3] = end_slot_bytes[1];

                // 8.2 Update Pwdm
                // 8.2.1 nft_account
                let mut ind_pwdm = Pwdm::NEXT_IND + (*nft_count) as usize * Pwdm::REPEATED_SIZE;
                *nft_count = *nft_count + 1;
                let acc_nft = acc_tmp_nft.as_ref().unwrap().clone();
                let acc_nft_bytes = acc_nft.key.as_ref();
                for i in 0usize..32usize {
                    pwdm_raw[ind_pwdm + i] = acc_nft_bytes[i];
                }
                ind_pwdm = ind_pwdm + 32;
                
                // 8.2.2 nft_mint
                let acc_mint = acc_tmp_mint.as_ref().unwrap().clone();
                let acc_mint_bytes = acc_mint.key.as_ref();
                for i in 0usize..32usize {
                    pwdm_raw[ind_pwdm + i] = acc_mint_bytes[i];
                }
                ind_pwdm = ind_pwdm + 32;

                // 8.2.4 nft_nth
                pwdm_raw[ind_pwdm]     = global_nft_count_bytes[0];
                pwdm_raw[ind_pwdm + 1] = global_nft_count_bytes[1];

                // 8.2.5 start_timestamp
                ind_pwdm = ind_pwdm + 2;
                pwdm_raw[ind_pwdm] = now_bytes[0];
                pwdm_raw[ind_pwdm + 1] = now_bytes[1];
                pwdm_raw[ind_pwdm + 2] = now_bytes[2];
                pwdm_raw[ind_pwdm + 3] = now_bytes[3];
                pwdm_raw[ind_pwdm + 4] = now_bytes[4];
                pwdm_raw[ind_pwdm + 5] = now_bytes[5];
                pwdm_raw[ind_pwdm + 6] = now_bytes[6];
                pwdm_raw[ind_pwdm + 7] = now_bytes[7];

                // 8.2.6 time_length_days
                ind_pwdm = ind_pwdm + 8;
                pwdm_raw[ind_pwdm] = time_length_days_bytes[0];
                pwdm_raw[ind_pwdm + 1] = time_length_days_bytes[1];
                
                // 8.3 Update Gsdm
                let mut tmp:[u8;2] = [0u8;2];
                for slot in start_slot..end_slot {
                    let mut gsdm_ind = Gsdm::NEXT_IND + slot as usize * Gsdm::repeated_size(proj_config.total_nfts);
                    
                    // update nft_count
                    tmp[0] = gsdm_raw[gsdm_ind];
                    tmp[1] = gsdm_raw[gsdm_ind + 1];
                    let mut nft_count = u16::from_le_bytes(tmp);
                    nft_count = nft_count + 1;
                    let nft_count_bytes = nft_count.to_le_bytes();
                    gsdm_raw[gsdm_ind]     = nft_count_bytes[0];
                    gsdm_raw[gsdm_ind + 1] = nft_count_bytes[1];
                    
                    // update nft_last_ind
                    gsdm_raw[gsdm_ind + 2] = global_nft_count_bytes[0];
                    gsdm_raw[gsdm_ind + 3] = global_nft_count_bytes[1];
                    
                    // update nft_nth
                    let nft_nth_ind = gsdm_ind + 4 + (*global_nft_count - 1) as usize;
                    gsdm_raw[nft_nth_ind] = 1;
                    
                }

                // 8.4 Transfer NFT ownership
                let acc_pda = acc_tmp_pda.as_ref().unwrap().clone();
                let owner_change_ix = spl_token::instruction::set_authority(
                    acc_token_prog.key,
                    &acc_nft.key,
                    Some(&acc_pda.key),
                    spl_token::instruction::AuthorityType::AccountOwner,
                    acc_staker.key,
                    &[&acc_staker.key],
                )?;
                invoke(
                    &owner_change_ix,
                    &[acc_nft.clone(), acc_staker.clone(), acc_token_prog.clone()],
                )?;
            }
            ind = ind + 1;
        }
        
        // 8.  Save Pwdm
        msg!("[Stake 8] Save Pwdm");
        Pwdm::pack(pwdm, &mut pwdm_raw)?;

        // 9. Save Gcdm
        msg!("[Stake 9] Save Gcdm");
        Gcdm::pack(gcdm, &mut gcdm_raw)?;

        // 10. Save Gsdm
        msg!("[Stake 10] Save Gsdm");
        Gsdm::pack(gsdm, &mut gsdm_raw)?;

        msg!("[Stake 11] Done!");
        
        Ok(())
    }

    fn process_reward_calc(accounts: &[AccountInfo], program_id: &Pubkey, start_nft_ind:u16, end_nft_ind:u16, slot:u16) -> ProgramResult {
        // 1. Resolve accounts
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_sys_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;

        // 2. Load Config
        msg!("[Reward Calc 2] Load Config");
        let mut raw_data_cofig = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&raw_data_cofig)?;

        let ciety_end_slot = proj_config.end_slot;
        let total_nfts_usize = proj_config.total_nfts as usize;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_gsdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);
        
        // 3. Load Gcdm
        msg!("[Reward Calc 3] Load Gcdm");
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;
        let Gcdm{
            is_initialized,
            ref mut last_calc_slot,
            global_nft_count
        }=gcdm;
        *last_calc_slot = slot;

        // 4. Load Gsdm       
        msg!("[Reward Calc 4] Load Gsdm"); 
        let mut gsdm_raw = acc_gsdm.data.borrow_mut();
        let mut gsdm = Gsdm::unpack_unchecked(&gsdm_raw)?;
        let Gsdm{
            is_initialized
        }=gsdm;

        // 5. Calc ciety emit on given slot
        msg!("[Reward Calc 5] Calc ciety emit on given slot");
        let ciety_emit = Self::calc_emit_u64(proj_config.start_emission, 0, slot, ciety_end_slot);
        
        // 6. Decode nft_count
        msg!("[Reward Calc 6] Decode nft_count");
        let nft_count    = Self::gsdm_decode_nft_count(&mut gsdm_raw, slot, proj_config.total_nfts);
        if(nft_count == 0){            
            return Ok(())
        }
        let nft_last_ind = Self::gsdm_decode_nft_last_ind(&mut gsdm_raw, slot, proj_config.total_nfts);
        if end_nft_ind > nft_last_ind + 1 {
            return Err(SolmateStakeError::EndNftIndOutOfRange.into());
        }
        
        // 7. Calc evNFT share and update Gcdm.nft_ciety correspondingly
        msg!("[Reward Calc 7] Calc reward share and update Gcdm.nft_ciety correspondingly");
        let mut gsdm_ind = Gsdm::NEXT_IND + 4 + slot as usize * Gsdm::repeated_size(proj_config.total_nfts);
        let mut c:[u8;8] = [0u8;8];
        for ind in start_nft_ind as usize..(end_nft_ind + 1) as usize {
            let staked = (gsdm_raw[gsdm_ind + ind] == 1);
            // gsdm_ind = gsdm_ind + ind + 1;

            if staked {
                // decode Gcdm.nft_ciety
                let mut nft_ciety = Self::gcdm_decode_nft_ciety(ind as u16, &gcdm_raw, &mut c);
                nft_ciety = nft_ciety + ciety_emit / nft_count as u64;
                
                // update Gcdm.nft_ciety
                let mut gcdm_ind = Gcdm::NEXT_IND + ind * Gcdm::REPEATED_SIZE;
                let nft_ciety_bytes = nft_ciety.to_le_bytes();
                gcdm_raw[gcdm_ind]     = nft_ciety_bytes[0];
                gcdm_raw[gcdm_ind + 1] = nft_ciety_bytes[1];
                gcdm_raw[gcdm_ind + 2] = nft_ciety_bytes[2];
                gcdm_raw[gcdm_ind + 3] = nft_ciety_bytes[3];
                gcdm_raw[gcdm_ind + 4] = nft_ciety_bytes[4];
                gcdm_raw[gcdm_ind + 5] = nft_ciety_bytes[5];
                gcdm_raw[gcdm_ind + 6] = nft_ciety_bytes[6];
                gcdm_raw[gcdm_ind + 7] = nft_ciety_bytes[7];
            }
        }
        
        // 8. Save Gcdm
        msg!("[Reward Calc 8] Save Gcdm");
        Gcdm::pack(gcdm, &mut gcdm_raw)?;

        msg!("[Reward Calc 9] Done!");
        Ok(())
    }

    fn process_increase_time_length(
        accounts: &[AccountInfo],
        increased_time_length_days: u16,
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Increse Time Length 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;
        
        // 2. Load proj config
        msg!("[Increse Time Length 2] Load config");
        let mut raw_data_cofig = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&raw_data_cofig)?;
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_gsdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Pwdm
        msg!("[Increse Time Length 3] Load Pwdm");
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;
        let Pwdm {
            is_initialized,
            ciety,
            nft_count,
            unstake_start
        } = pwdm;

        // 4. Load Gcdm
        msg!("[Increse Time Length 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;
        let Gcdm{
            is_initialized,
            last_calc_slot,
            ref mut global_nft_count
        }=gcdm;

        // 5. Load Gsdm
        msg!("[Increse Time Length 5] Load Gsdm");
        let mut gsdm_raw = acc_gsdm.data.borrow_mut();
        let mut gsdm = Gsdm::unpack_unchecked(&gsdm_raw)?;
        let Gsdm{
            is_initialized,
        }=gsdm;
        
        // 6. Update Gcdm and Gsdm
        msg!("[Increse Time Length 6] Update Gcdm and Gsdm"); 
        let mut a:[u8;2] = [0u8;2];
        let mut b:[u8;8] = [0u8;8];
        let clock = Clock::get()?;
        let mut reward = 0u64;
        for ind in 0..nft_count {
            // 5.0 Decode Gcdm.start_slot and Gcdm.end_slot
            let (start_slot, end_slot) = Self::gcdm_decode_slot_interval(ind, &mut gcdm_raw, &mut b, &mut a);
            
            // 5.1 Skip expired
            let end_time = proj_config.init_timestamp + (end_slot as u32 * proj_config.decay_frequency_seconds) as i64;
            if(end_time < clock.unix_timestamp){                
                // return Err(SolmateStakeError::CannotIncreaseTimeLengthOnExpiredNFT.into());
                continue;
            }
            
            // 5.2 Calculate Gcdm.end_slot
            let mut end_slot_new = end_slot + increased_time_length_days;

            // 5.3 Decode Pwdm.nft_nth
            let nft_nth = Self::pwdm_decode_nft_nth(ind, &pwdm_raw, &mut a);

            // 5.2 Update Gsdm
            for slot in end_slot..end_slot_new {
                let mut gsdm_ind = Gsdm::NEXT_IND + slot as usize * Gsdm::repeated_size(proj_config.total_nfts);
                
                // update nft_count
                a[0] = gsdm_raw[gsdm_ind];
                a[1] = gsdm_raw[gsdm_ind + 1];
                let mut nft_count = u16::from_le_bytes(a);
                nft_count = nft_count + 1;
                let nft_count_bytes = nft_count.to_le_bytes();
                gsdm_raw[gsdm_ind]     = nft_count_bytes[0];
                gsdm_raw[gsdm_ind + 1] = nft_count_bytes[1];
                
                // update nft_last_ind
                let ori_last_nft_nth_ind = Self::gsdm_decode_nft_last_ind(&mut gsdm_raw, slot, proj_config.total_nfts);
                if nft_nth > ori_last_nft_nth_ind {
                    let nft_nth_bytes = nft_nth.to_le_bytes();
                    gsdm_raw[gsdm_ind + 2] = nft_nth_bytes[0];
                    gsdm_raw[gsdm_ind + 3] = nft_nth_bytes[1];
                }
                
                // update nft_nth
                let nft_nth_ind = gsdm_ind + 4 + nft_nth as usize;
                gsdm_raw[nft_nth_ind] = 1;
            }
            
            // 5.3 Encode Gcdm.end_slot
            Self::gcdm_encode_end_slot(ind,&mut gcdm_raw,&mut a, end_slot_new);

            // 5.4 Decode Pwdm.time_length_days
            let mut ori_time_length_days = Self::pwdm_decode_time_length_days(ind, &mut pwdm_raw, &mut a);  
            
            // 5.5 Calc new Pwdm.time_length_days
            let time_length_days = ori_time_length_days + increased_time_length_days;

            // 5.6 Encode Pwdm.time_length_days
            Self::pwdm_encode_time_length_days(ind, &mut pwdm_raw, &mut a, time_length_days);  
        }

        // 7. Save Gcdm
        msg!("[Increse Time Length 7] Save Gcdm");
        Gcdm::pack(gcdm, &mut gcdm_raw)?;

        // 8. Save Pwdm
        msg!("[Increse Time Length 8] Save Pwdm");
        Pwdm::pack(pwdm, &mut pwdm_raw)?;

        // 9. Save Gsdm
        msg!("[Increse Time Length 9] Save Gsdm");
        Gsdm::pack(gsdm, &mut gsdm_raw)?;

        msg!("[Increse Time Length 10] Done!");
        Ok(())
    }

    fn process_unstake(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Unstake 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        
        let acc_init = next_account_info(account_iter)?;
        let acc_ciety = next_account_info(account_iter)?;
        let acc_pwdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_sys_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_staker = next_account_info(account_iter)?;
        let acc_solmate_token_prog = next_account_info(account_iter)?;
        let acc_ciety_receiver = next_account_info(account_iter)?;
        let acc_ciety_mint = next_account_info(account_iter)?;
        let acc_ciety_pda = next_account_info(account_iter)?;
        let acc_solmate_stake_prog = next_account_info(account_iter)?;

        // 2. Load config
        msg!("[Unstake 2] Load config");
        let raw_data_cofig = acc_config.data.borrow();
        let proj_config = ConfigDM::unpack_unchecked(&raw_data_cofig)?;
        let seed_pda_nft = proj_config.seed_pda_nft.as_bytes();
     
        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_pwdm, &program_id);
        Self::check_owner(&acc_gcdm, &program_id);
        Self::check_owner(&acc_config, &acc_solmate_token_prog.key);

        // 3. Load Pwdm
        msg!("[Unstake 3] Load Pwdm");
        // let pwdm_raw = *Rc::try_unwrap(acc_pwdm.data).unwrap_err().borrow();
        // let tmp = Rc::clone(&acc_pwdm.data);
        let mut pwdm_raw = acc_pwdm.data.borrow_mut();
        let mut pwdm = Pwdm::unpack_unchecked(&pwdm_raw)?;
        
        // 4. Load Gcdm
        msg!("[Unstake 4] Load Gcdm"); 
        let mut gcdm_raw = acc_gcdm.data.borrow_mut();
        let mut gcdm = Gcdm::unpack_unchecked(&gcdm_raw)?;

        // 5. Transfer Solmate NFT to staker        
        msg!("[Unstake 5] Transfer Solmate NFT to staker ");
        let mut acc_nft:Option<AccountInfo<'_>> = None;
        let mut acc_pda:Option<AccountInfo<'_>> = None;
        let mut acc_mint:Option<AccountInfo<'_>> = None;
        let mut ind = 0usize;
        let mut a:[u8;2] = [0u8;2];
        let mut unstaked_cnt = 016;
        while let Some(acc) = account_iter.next() {
            let r = ind % 4;
            if r == 0 {
                acc_nft = Some(acc.clone());
            }else if r == 1 {
                acc_pda = Some(acc.clone());
            }else if r == 2 {
                acc_mint = Some(acc.clone());
            } else {
                // 5.1 Transfer Solmate NFT to staker 
                msg!("[Unstake 5.1] Transfer Solmate NFT to staker ");
                let acc_nft_receiver = acc;
                let mint_acc = acc_mint.as_ref().unwrap();
                let (pda, nonce) = Pubkey::find_program_address(&[&seed_pda_nft, &mint_acc.key.as_ref()], program_id);
                let source_acc = acc_nft.as_ref().unwrap();
                let pda_acc = acc_pda.as_ref().unwrap();
                let transfer_to_taker_ix = spl_token::instruction::transfer(
                    acc_token_prog.key,
                    source_acc.key,
                    acc_nft_receiver.key,
                    &pda,
                    &[&pda],
                    1,
                )?;
                invoke_signed(
                    &transfer_to_taker_ix,
                    &[
                        source_acc.clone(),
                        acc_nft_receiver.clone(),
                        pda_acc.clone(),
                        acc_token_prog.clone(),
                    ],
                    &[&[&seed_pda_nft[..], &mint_acc.key.as_ref()[..], &[nonce]]],
                )?;
                
                unstaked_cnt = unstaked_cnt + 1;

                if(unstaked_cnt as u8 > proj_config.unstake_batch_size){
                    return Err(SolmateStakeError::UnstakeLimitExceeded.into());
                }
            }
            ind = ind + 1;
        }

        if(pwdm.unstake_start + unstaked_cnt == pwdm.nft_count){
            // 6. Transfer $CIETY to staker
            msg!("[Unstake 6] Transfer $CIETY to staker");     
            let reward = (pwdm.ciety * u64::pow(10, proj_config.ciety_decimals as u32) as f64) as u64;
            let data = InsTransferCiety{amount: reward}.pack();
            let ins = Instruction::new_with_bytes(
                *acc_solmate_token_prog.key,
                &*data, 
                vec![
                    AccountMeta::new(*acc_init.key, true),
                    AccountMeta::new(*acc_ciety.key, false),
                    AccountMeta::new(*acc_ciety_receiver.key, false),
                    AccountMeta::new_readonly(*acc_ciety_pda.key, false),
                    AccountMeta::new_readonly(*acc_token_prog.key, false),
                    AccountMeta::new_readonly(*acc_ciety_mint.key, false),
                    AccountMeta::new_readonly(*acc_config.key, false),
                ]);
            invoke(
                &ins,
                &[
                    acc_init.clone(),
                    acc_ciety.clone(),
                    acc_ciety_receiver.clone(),
                    acc_ciety_pda.clone(),
                    acc_token_prog.clone(),
                    acc_ciety_mint.clone(),      
                    acc_config.clone(),  
                ]
            )?;
    
            // 7. Transfer Pwdm SOL to staker and close Pwdm
            msg!("[Unstake 8] Transfer Pwdm SOL to staker and close Pwdm");
            **acc_staker.lamports.borrow_mut() = acc_staker
                .lamports()
                .checked_add(acc_pwdm.lamports())
                .ok_or(SolmateStakeError::AmountOverflow)?;
            **acc_pwdm.lamports.borrow_mut() = 0;
            *pwdm_raw = &mut [];
            
            msg!("[Unstake 9] Completely done!");
        }else{
            // 8. Save Pwdm
            msg!("[Unstake 8] Save Pwdm and calc the number of NFTs to be unstaked");
            let leftover = pwdm.nft_count - pwdm.unstake_start - unstaked_cnt;
            pwdm.unstake_start = pwdm.unstake_start + unstaked_cnt;
            Pwdm::pack(pwdm, &mut pwdm_raw)?;

            msg!("[Unstake 9] Still have {} NFTs to be unstaked.", leftover);
        }
        Ok(())
    }

    fn gsdm_decode_nft_last_ind (gsdm_raw:&mut [u8], slot:u16, total_nfts:u16) -> u16 {
        let gsdm_ind = Gsdm::NEXT_IND + 2 + slot as usize * Gsdm::repeated_size(total_nfts);
        let mut a:[u8;2] = [0u8;2];
        a[0] = gsdm_raw[gsdm_ind];
        a[1] = gsdm_raw[gsdm_ind + 1];
        let nft_last_ind = u16::from_le_bytes(a);
        return nft_last_ind;
    }

    fn gsdm_decode_nft_count (gsdm_raw:&mut [u8], slot:u16, total_nfts:u16) -> u16 {
        let gsdm_ind = Gsdm::NEXT_IND + slot as usize * Gsdm::repeated_size(total_nfts);
        let mut a:[u8;2] = [0u8;2];
        a[0] = gsdm_raw[gsdm_ind];
        a[1] = gsdm_raw[gsdm_ind + 1];
        let nft_count = u16::from_le_bytes(a);
        return nft_count;
    }

    fn pwdm_decode_nft_nth (ind:u16, pwdm_raw:&[u8], a:&mut [u8;2]) -> u16{
        let mut pwdm_ind = Pwdm::NEXT_IND + (32 + 32) + ind as usize * Pwdm::REPEATED_SIZE;
        a[0] = pwdm_raw[pwdm_ind];
        a[1] = pwdm_raw[pwdm_ind + 1];
        let nft_nth = u16::from_le_bytes(*a);
        return nft_nth
    }

    fn pwdm_decode_time_length_days (ind:u16, pwdm_raw:&mut [u8], a:&mut [u8;2]) -> u16{
        let mut pwdm_ind = Pwdm::NEXT_IND + (32 + 32 + 2 + 8) + ind as usize * Pwdm::REPEATED_SIZE;
        a[0] = pwdm_raw[pwdm_ind];
        a[1] = pwdm_raw[pwdm_ind + 1];
        let time_length_days = u16::from_le_bytes(*a);
        return time_length_days
    }

    fn pwdm_encode_time_length_days (ind:u16, pwdm_raw:&mut [u8], a:&mut [u8;2], time_length_days:u16){
        let mut pwdm_ind = Pwdm::NEXT_IND + (32 + 32 + 2 + 8) + ind as usize * Pwdm::REPEATED_SIZE;
        let bytes = time_length_days.to_le_bytes();
        pwdm_raw[pwdm_ind]     = bytes[0];
        pwdm_raw[pwdm_ind + 1] = bytes[1];
    }

    fn gcdm_encode_end_slot (nft_nth:u16, gcdm_raw:&mut [u8], a:&mut [u8;2], end_slot:u16){
        let gcdm_ind = Gcdm::NEXT_IND + 8 + 2 + nft_nth as usize * Gcdm::REPEATED_SIZE;
        let end_slot_bytes = end_slot.to_le_bytes();
        gcdm_raw[gcdm_ind] = end_slot_bytes[0];
        gcdm_raw[gcdm_ind + 1] = end_slot_bytes[1];
    }

    fn gcdm_decode_end_slot (nft_nth:u16, gcdm_raw:&mut [u8], a:&mut [u8;2]) -> u16{
        let gcdm_ind = Gcdm::NEXT_IND + 8 + 2 + nft_nth as usize * Gcdm::REPEATED_SIZE;
        a[0] = gcdm_raw[gcdm_ind];
        a[1] = gcdm_raw[gcdm_ind + 1];
        let end_slot = u16::from_le_bytes(*a);
        return end_slot;
    }

    fn gcdm_decode_slot_interval (nft_nth:u16, gcdm_raw:&mut [u8], b:&mut [u8;8], a:&mut [u8;2]) -> (u16, u16){
        // 5.2 Add up rewarded ciety
        let gcdm_ind = Gcdm::NEXT_IND + nft_nth as usize * Gcdm::REPEATED_SIZE;

        // 5.3 Resolve start_slot
        a[0] = gcdm_raw[gcdm_ind + 8];
        a[1] = gcdm_raw[gcdm_ind + 9];
        let start_slot = u16::from_le_bytes(*a);

        // 5.4 Resolve end_slot
        a[0] = gcdm_raw[gcdm_ind + 10];
        a[1] = gcdm_raw[gcdm_ind + 11];
        let end_slot = u16::from_le_bytes(*a);

        (start_slot, end_slot)
    }

    fn gcdm_decode_nft_ciety (nft_nth:u16, gcdm_raw:&[u8], b:&mut [u8;8]) -> u64{
        let gcdm_ind = Gcdm::NEXT_IND + nft_nth as usize * Gcdm::REPEATED_SIZE;
        b[0] = gcdm_raw[gcdm_ind];
        b[1] = gcdm_raw[gcdm_ind + 1];
        b[2] = gcdm_raw[gcdm_ind + 2];
        b[3] = gcdm_raw[gcdm_ind + 3];
        b[4] = gcdm_raw[gcdm_ind + 4];
        b[5] = gcdm_raw[gcdm_ind + 5];
        b[6] = gcdm_raw[gcdm_ind + 6];
        b[7] = gcdm_raw[gcdm_ind + 7];
        let nft_ciety = u64::from_le_bytes(*b);
        return nft_ciety;
    }

    fn gcdm_zero_nft_ciety (nft_nth:u16, gcdm_raw:&mut [u8]) {
        let gcdm_ind = Gcdm::NEXT_IND + nft_nth as usize * Gcdm::REPEATED_SIZE;
        gcdm_raw[gcdm_ind] = 0;
        gcdm_raw[gcdm_ind + 1] = 0;
        gcdm_raw[gcdm_ind + 2] = 0;
        gcdm_raw[gcdm_ind + 3] = 0;
        gcdm_raw[gcdm_ind + 4] = 0;
        gcdm_raw[gcdm_ind + 5] = 0;
        gcdm_raw[gcdm_ind + 6] = 0;
        gcdm_raw[gcdm_ind + 7] = 0;
    }

    fn calc_slot (now: i64, decay_frequency_seconds: u32, init_timestamp: i64) -> u16 {
        let rtn = (now - init_timestamp) / (decay_frequency_seconds as i64);
        return rtn as u16;
    } 
    
    fn calc_venft (stake_start:&u16, stake_end:&u16, curr_slot:&u16, ind:&usize) -> f32 {
        let total = stake_end - stake_start + 1;
        let share = (total - curr_slot) as f32 / total as f32;
        return share;
    }

    fn calc_emit_u64 (init_value:u32, start_slot:u16, curr_slot:u16, total_slots:u16) -> u64{
        let elapsed = curr_slot - start_slot;
        let rtn = init_value as u64 * 10_0000_0000 * (total_slots as u64 - elapsed as u64)/(total_slots as u64);
        return rtn as u64;
    }

    fn calc_reward_per_wallet(nft_count:u16, pwdm_raw:&[u8], gcdm_raw:&[u8]) -> u64{        
        let mut a:[u8;2] = [0u8;2];
        let mut b:[u8;8] = [0u8;8];
        let mut total_ciety = 0u64;
        for ind in 0..nft_count {
            // resolve nft_nth
            let nft_nth = Self::pwdm_decode_nft_nth(ind, &pwdm_raw, &mut a);

            // read ciety in Gcdm
            let nft_ciety = Self::gcdm_decode_nft_ciety(nft_nth, &gcdm_raw, &mut b);

            let nft_ciety_f64 = nft_ciety;
            total_ciety = total_ciety + nft_ciety_f64;
        }
        return total_ciety;
    }

    fn zero_ciety_per_wallet(nft_count:u16, pwdm_raw:&mut [u8], gcdm_raw:&mut [u8]){        
        let mut a:[u8;2] = [0u8;2];
        for ind in 0..nft_count {
            // resolve nft_nth
            let nft_nth = Self::pwdm_decode_nft_nth(ind, &pwdm_raw, &mut a);

            // zero ciety in Gcdm
            Self::gcdm_zero_nft_ciety(ind, &mut *gcdm_raw);
        }
    }
   
    fn check_acc_init(acc_init:&AccountInfo, proj_config:&ConfigDM)->ProgramResult{
        if !acc_init.is_signer {
            return Err(SolmateStakeError::FirstAccountNotASigner.into());
        }
        if *acc_init.key != proj_config.init_pubkey {
            return Err(SolmateStakeError::FirstAccountNotInitializer.into());
        }
        if !proj_config.is_initialized {
            return Err(SolmateStakeError::ProjNotInitialized.into());
        }
        Ok(())
    }

    fn check_owner(acc:&AccountInfo, pubkey:&Pubkey)->ProgramResult{
        if acc.owner != pubkey {
            return Err(ProgramError::IncorrectProgramId);
        }
        Ok(())
    }

    fn check_rent(acc_rent:&AccountInfo, acc:&AccountInfo, error:SolmateStakeError)->ProgramResult{        
        let rent = &Rent::from_account_info(acc_rent)?;
        if !rent.is_exempt(acc.lamports(), acc.data_len()) {
            return Err(error.into());
        }
        Ok(())
    }

    fn check_size(acc:&AccountInfo, configured_len:usize, error:SolmateStakeError)->ProgramResult{
        if acc.data_len() != configured_len {
            return Err(error.into());
        }
        Ok(())
    }

}
