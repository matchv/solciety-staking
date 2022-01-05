use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed, invoke_signed_unchecked},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    system_instruction,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
};
use spl_associated_token_account::{create_associated_token_account, get_associated_token_address};
use spl_token::state::{Account as TokenAccount, Mint};
use spl_token_metadata::{
    instruction::{create_metadata_accounts, update_metadata_accounts},
    state::{Data, Metadata, PREFIX},
};
use crate::{
    v2_error::{SolmateCommonError, SolmateTokenError},
    v2_instruction::SolmateInsV2,
    v2_state::{ConfigDM},
};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = SolmateInsV2::unpack(instruction_data)?;
        match instruction {
            SolmateInsV2::InsConfig {
                stake_min_days,
                stake_max_days,
                emission_total_days,
                ciety_decimals,
                start_emission,
                decay_frequency_seconds,
                total_nfts,
                max_stake_per_wallet,
                max_stake_each_time,
                nft_author_cnt,
                pwdm_size,
                unstake_batch_size,
                seed_pwdm,
                seed_pda_ciety,
                seed_pda_nft,
            } => {
                Processor::process_init(
                    accounts,

                    stake_min_days,
                    stake_max_days,
                    emission_total_days,
                    ciety_decimals,
                    start_emission,
                    decay_frequency_seconds,
                    total_nfts,
                    max_stake_per_wallet,
                    max_stake_each_time,
                    nft_author_cnt,
                    pwdm_size,
                    unstake_batch_size,
                    seed_pwdm,
                    seed_pda_ciety,
                    seed_pda_nft,

                    program_id,
                )
            },
            SolmateInsV2::InsTransferCiety{amount} => {Self::process_transfer_ciety(
                accounts,

                amount,

                program_id,

            )}
        }
    }

    fn process_transfer_ciety(
        accounts: &[AccountInfo],
        amount: u64,
        program_id: &Pubkey) -> ProgramResult{
        // 1. Resolve accounts
        msg!("[Transfer_ciety 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_ciety_holder = next_account_info(account_iter)?;
        let acc_ciety_receiver = next_account_info(account_iter)?;
        let acc_ciety_pda = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_ciety_mint = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;

        let raw_data_cofig = acc_config.data.borrow_mut();
        let proj_config = ConfigDM::unpack_unchecked(&raw_data_cofig)?;

        Self::check_acc_init(&acc_init, &proj_config);
        Self::check_owner(&acc_config, &program_id);

        
        // 2. Transfer $CIETY to staker
        msg!("[Transfer_ciety 2] Transfer $CIETY to staker");
        let ciety_pda_seed_bytes = proj_config.seed_pda_ciety.as_bytes();
        let (pda, nonce) = Pubkey::find_program_address(&[&ciety_pda_seed_bytes, &acc_ciety_mint.key.as_ref()], program_id);
        let transfer_to_taker_ix = spl_token::instruction::transfer(
            acc_token_prog.key,
            acc_ciety_holder.key,
            acc_ciety_receiver.key,
            &pda,
            &[&pda],
            amount,
        )?;

        invoke_signed_unchecked(
            &transfer_to_taker_ix,
            &[
                acc_ciety_holder.clone(),
                acc_ciety_receiver.clone(),
                acc_ciety_pda.clone(),
                acc_token_prog.clone(),
            ],
            &[&[&ciety_pda_seed_bytes[..], &acc_ciety_mint.key.as_ref()[..], &[nonce]]],
        )?;

        msg!("[Transfer_ciety 3] Done!");
        Ok(())
    }  

    fn check_acc_init(acc_init:&AccountInfo, proj_config:&ConfigDM)->ProgramResult{
        if !acc_init.is_signer {
            return Err(SolmateTokenError::FirstAccountNotASigner.into());
        }
        if *acc_init.key != proj_config.init_pubkey {
            return Err(SolmateTokenError::FirstAccountNotInitializer.into());
        }
        if !proj_config.is_initialized {
            return Err(SolmateTokenError::ProjNotInitialized.into());
        }
        Ok(())
    }

    fn check_owner(acc:&AccountInfo, pubkey:&Pubkey)->ProgramResult{
        if acc.owner != pubkey {
            return Err(ProgramError::IncorrectProgramId);
        }
        Ok(())
    }

    fn check_rent(acc_rent:&AccountInfo, acc:&AccountInfo, error:SolmateTokenError)->ProgramResult{        
        let rent = &Rent::from_account_info(acc_rent)?;
        if !rent.is_exempt(acc.lamports(), acc.data_len()) {
            return Err(error.into());
        }
        Ok(())
    }

    fn check_size(acc:&AccountInfo, configured_len:usize, error:SolmateTokenError)->ProgramResult{
        if acc.data_len() != configured_len {
            return Err(error.into());
        }
        Ok(())
    }

    fn process_init(
        accounts: &[AccountInfo],

        stake_min_days: u16,
        stake_max_days: u16,
        emission_total_days: u16,
        ciety_decimals: u8,
        start_emission: u32,
        decay_frequency_seconds: u32,
        total_nfts: u16,
        max_stake_per_wallet: u16,
        max_stake_each_time: u16,
        nft_author_cnt: u8,
        pwdm_size: u16,
        unstake_batch_size: u8,
        seed_pwdm: String,
        seed_pda_ciety: String,
        seed_pda_nft: String,

        program_id: &Pubkey,
    ) -> ProgramResult {
        // 1. Resolve accounts
        msg!("[Init 1] Resolve accounts");
        let account_iter = &mut accounts.iter();
        let acc_init = next_account_info(account_iter)?;
        let acc_config = next_account_info(account_iter)?;
        let acc_ciety_holder = next_account_info(account_iter)?;
        let acc_token_prog = next_account_info(account_iter)?;
        let acc_rent = next_account_info(account_iter)?;
        let acc_ciety_mint = next_account_info(account_iter)?;
        let acc_gsdm = next_account_info(account_iter)?;
        let acc_gcdm = next_account_info(account_iter)?;
        let acc_rpdm = next_account_info(account_iter)?;
        
        // 2. The lamports of config account must be enough for rent exemption
        msg!("[Init 2] The lamports of config account must be enough for rent exemption");
        if !acc_init.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        
        // 3. Check if the config account has been initialized
        msg!("[Init 3] Check if the config account has been initialized");
        Self::check_rent(acc_rent, acc_config, SolmateTokenError::NotRentExempt_ConfigDM);
        Self::check_size(acc_config, ConfigDM::LEN, SolmateTokenError::ConfigAccountWrongSize);
        let mut proj_config_raw = acc_config.data.borrow_mut();
        let mut proj_config = ConfigDM::unpack_unchecked(&proj_config_raw)?;
        if proj_config.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        // 4. Initialize ConfigDM
        msg!("[Init 4] Initialize ConfigDM");
        let clock = Clock::get()?;
        proj_config.is_initialized = true;
        proj_config.init_pubkey = *acc_init.key;
        proj_config.ciety_pubkey = *acc_ciety_holder.key;
        proj_config.ciety_mint_pubkey = *acc_ciety_mint.key;
        proj_config.gsdm_pubkey = *acc_gsdm.key;
        proj_config.gcdm_pubkey = *acc_gcdm.key;
        proj_config.rpdm_pubkey = *acc_rpdm.key;
        proj_config.pwdm_size = pwdm_size;
        proj_config.stake_min_days = stake_min_days;
        proj_config.stake_max_days = stake_max_days;
        proj_config.emission_total_days = emission_total_days;
        proj_config.ciety_decimals = ciety_decimals;
        proj_config.start_emission = start_emission;
        proj_config.init_timestamp = clock.unix_timestamp;
        proj_config.decay_frequency_seconds = decay_frequency_seconds;
        proj_config.end_slot = emission_total_days;
        proj_config.nft_author_cnt = nft_author_cnt;
        proj_config.total_nfts = total_nfts;
        proj_config.max_stake_per_wallet = max_stake_per_wallet;
        proj_config.max_stake_each_time = max_stake_each_time;
        proj_config.unstake_batch_size = unstake_batch_size;
        proj_config.seed_pwdm = seed_pwdm;
        proj_config.seed_pda_ciety = seed_pda_ciety.clone();
        proj_config.seed_pda_nft = seed_pda_nft;

        // 5. Decode and update NFT authors
        msg!("[Init 5] Decode and update NFT authors");
        // let mut nft_author_cnts = 0;        
        // let mut auther_bytes:[u8; 32] = [0u8; 32];
        while let Some(acc) = account_iter.next() {
            // let ind_config = ConfigDM::NEXT_IND + nft_author_cnts * ConfigDM::REPEATED_SIZE;
            // auther_bytes.copy_from_slice(acc.key.as_ref());
            // for i in 0usize..32usize {
            //     proj_config_raw[ind_config + i] = auther_bytes[i];
            // }
            // nft_author_cnts = nft_author_cnts + 1;
            proj_config.nft_authors.push(*acc.key);
        }
        // if(nft_author_cnts > ConfigDM::MAX_NFT_AUTHORS){
        //     return Err(SolmateTokenError::MaxNFTAuthorLimitExceeded.into());
        // }

        // 6. Save ConfigDM
        msg!("[Init 6] Save ConfigDM");
        ConfigDM::pack(proj_config, &mut proj_config_raw)?;

        // 7. Transfer the ownership of reward account to PDA
        msg!("[Init 7] Transfer the ownership of reward account to PDA");
        let ciety_pda_seed_bytes = seed_pda_ciety.as_bytes();
        let (pda, nonce) = Pubkey::find_program_address(&[&ciety_pda_seed_bytes, &acc_ciety_mint.key.as_ref()], program_id);
        let owner_change_ix = spl_token::instruction::set_authority(
            acc_token_prog.key,
            acc_ciety_holder.key,
            Some(&pda),
            spl_token::instruction::AuthorityType::AccountOwner,
            acc_init.key,
            &[&acc_init.key],
        )?;
        invoke(
            &owner_change_ix,
            &[
                acc_ciety_holder.clone(),
                acc_init.clone(),
                acc_token_prog.clone(),
            ],
        )?;

        msg!("[Init 8] Done!");
        Ok(())
    }
}
