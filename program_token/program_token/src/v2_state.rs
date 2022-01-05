use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};
use std::convert::TryInto;
use std::mem::size_of;
use crate::v2_error::{SolmateCommonError::InvalidInstruction};

pub struct ConfigDM {
    pub is_initialized: bool,
    pub init_pubkey: Pubkey,
    pub ciety_pubkey: Pubkey,
    pub ciety_mint_pubkey: Pubkey,
    pub gsdm_pubkey: Pubkey,
    pub gcdm_pubkey: Pubkey,
    pub rpdm_pubkey: Pubkey,
    pub pwdm_size: u16,
    pub stake_min_days: u16,
    pub stake_max_days: u16,
    pub emission_total_days: u16,
    pub ciety_decimals: u8,
    pub start_emission: u32,
    pub init_timestamp: i64,
    pub decay_frequency_seconds: u32,
    pub end_slot: u16,
    pub nft_author_cnt: u8,
    pub total_nfts: u16,
    pub max_stake_per_wallet: u16,
    pub max_stake_each_time: u16,
    pub unstake_batch_size: u8,
    pub nft_authors: Vec<Pubkey>,
    pub seed_pwdm: String,
    pub seed_pda_ciety: String,
    pub seed_pda_nft: String,
}

impl Sealed for ConfigDM {}
impl ConfigDM{
    pub const NEXT_IND:usize = 228usize;
    pub const REPEATED_SIZE:usize = 32;
    pub const MAX_NFT_AUTHORS:usize = 10;

    pub fn pack_string_u8_len(value:&String, buf:&mut Vec<u8>){
        let bytes = value.as_bytes();
        buf.extend((bytes.len() as u8).to_le_bytes().to_vec().into_iter());
        buf.extend(bytes.to_vec().into_iter());
    }

    pub fn unpack_string_u8_len(input: &[u8]) -> Result<(&[u8], String), ProgramError> {
        let (len_bytes, rest) = input.split_at(1);
        let temp:[u8;1] = len_bytes.try_into().unwrap();
        let len = u8::from_le_bytes(temp) as usize;
        let name = rest
            .get(..len)
            .and_then(|slice| slice.try_into().ok())
            .map(std::str::from_utf8)
            .ok_or(InvalidInstruction)?;
        
        Ok((rest.split_at(len).1, String::from(name.unwrap())))
    }
}
impl IsInitialized for ConfigDM {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Pack for ConfigDM {
    /**
     * =========Config head, 228 bytes=============
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
    const LEN: usize = 608;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, ConfigDM::LEN];
        let (
            is_initialized,
            init_pubkey,
            ciety_pubkey,
            ciety_mint_pubkey,
            gsdm_pubkey,
            gcdm_pubkey,
            rpdm_pubkey,
            pwdm_size,
            stake_min_days,
            stake_max_days,
            emission_total_days,
            ciety_decimals,
            start_emission,
            init_timestamp,
            decay_frequency_seconds,
            end_slot,
            nft_author_cnt,
            total_nfts,
            max_stake_per_wallet,
            max_stake_each_time,
            unstake_batch_size,
            nft_authors,
            seeds            
        ) = array_refs![src, 1, 32, 32, 32, 32, 32, 32, 2, 2, 2, 2, 1, 4, 8, 4, 2, 1, 2, 2, 2, 1, 32 * 10, 20 * 3];
        
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };
        
        let mut rtn = ConfigDM {
            is_initialized: is_initialized,
            init_pubkey: Pubkey::new_from_array(*init_pubkey),
            ciety_pubkey: Pubkey::new_from_array(*ciety_pubkey),
            ciety_mint_pubkey: Pubkey::new_from_array(*ciety_mint_pubkey),
            gsdm_pubkey: Pubkey::new_from_array(*gsdm_pubkey),
            gcdm_pubkey: Pubkey::new_from_array(*gcdm_pubkey),
            rpdm_pubkey: Pubkey::new_from_array(*rpdm_pubkey),
            pwdm_size: u16::from_le_bytes(*pwdm_size),
            stake_min_days: u16::from_le_bytes(*stake_min_days),
            stake_max_days: u16::from_le_bytes(*stake_max_days),
            emission_total_days: u16::from_le_bytes(*emission_total_days),
            ciety_decimals: u8::from_le_bytes(*ciety_decimals),
            start_emission: u32::from_le_bytes(*start_emission),
            init_timestamp: i64::from_le_bytes(*init_timestamp),
            decay_frequency_seconds: u32::from_le_bytes(*decay_frequency_seconds),
            end_slot: u16::from_le_bytes(*end_slot),
            nft_author_cnt: nft_author_cnt[0],
            total_nfts: u16::from_le_bytes(*total_nfts),
            max_stake_per_wallet: u16::from_le_bytes(*max_stake_per_wallet),
            max_stake_each_time: u16::from_le_bytes(*max_stake_each_time),
            unstake_batch_size: unstake_batch_size[0],
            nft_authors: Vec::with_capacity(255),
            seed_pwdm: String::from(""),
            seed_pda_ciety: String::from(""),
            seed_pda_nft: String::from(""),
        };

        let mut a:[u8; 32] = [0u8; 32];
        for i in 0..rtn.nft_author_cnt{
            let mut ind = Self::NEXT_IND + i as usize * Self::REPEATED_SIZE;
            for j in 0..32 {
                a[j] = src[ind + j];
            }
            rtn.nft_authors.push(Pubkey::new_from_array(a));
        }
       
        let (rest, seed_pwdm) = Self::unpack_string_u8_len(seeds)?;
        let (rest, seed_pda_ciety) = Self::unpack_string_u8_len(rest)?;
        let (rest, seed_pda_nft) = Self::unpack_string_u8_len(rest)?;

        rtn.seed_pwdm = seed_pwdm;
        rtn.seed_pda_ciety = seed_pda_ciety;
        rtn.seed_pda_nft = seed_pda_nft;

        return Ok(rtn);
    }


    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, ConfigDM::LEN];
        let (
            is_initialized_dst,
            init_pubkey_dst,
            ciety_pubkey_dst,
            ciety_mint_pubkey_dst,
            gsdm_pubkey_dst,
            gcdm_pubkey_dst,
            rpdm_pubkey_dst,
            pwdm_size_dst,
            stake_min_days_dst,
            stake_max_days_dst,
            emission_total_days_dst,
            ciety_decimals_dst,
            start_emission_dst,
            init_timestamp_dst,
            decay_frequency_seconds_dst,
            end_slot_dst,
            nft_author_cnt_dst,
            total_nfts_dst,
            max_stake_per_wallet_dst,
            max_stake_each_time_dst,
            unstake_batch_size_dst,
            nft_authors_dst,
            seeds_dst,
        ) = mut_array_refs![dst, 1, 32, 32, 32, 32, 32, 32, 2, 2, 2, 2, 1, 4, 8, 4, 2, 1, 2, 2, 2, 1, 32 * 10, 20 * 3];

        let ConfigDM {
            is_initialized,
            init_pubkey,
            ciety_pubkey,
            ciety_mint_pubkey,
            gsdm_pubkey,
            gcdm_pubkey,
            rpdm_pubkey,
            pwdm_size,
            stake_min_days,
            stake_max_days,
            emission_total_days,
            ciety_decimals,
            start_emission,
            init_timestamp,
            decay_frequency_seconds,
            end_slot,
            nft_author_cnt,
            total_nfts,
            max_stake_per_wallet,
            max_stake_each_time,
            unstake_batch_size,
            nft_authors,
            seed_pwdm,
            seed_pda_ciety,
            seed_pda_nft,
        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        init_pubkey_dst.copy_from_slice(init_pubkey.as_ref());
        ciety_pubkey_dst.copy_from_slice(ciety_pubkey.as_ref());
        ciety_mint_pubkey_dst.copy_from_slice(ciety_mint_pubkey.as_ref());
        gsdm_pubkey_dst.copy_from_slice(gsdm_pubkey.as_ref());
        gcdm_pubkey_dst.copy_from_slice(gcdm_pubkey.as_ref());
        rpdm_pubkey_dst.copy_from_slice(rpdm_pubkey.as_ref());
        *pwdm_size_dst = pwdm_size.to_le_bytes();
        *stake_min_days_dst = stake_min_days.to_le_bytes();
        *stake_max_days_dst = stake_max_days.to_le_bytes();
        *emission_total_days_dst = emission_total_days.to_le_bytes();
        *ciety_decimals_dst = ciety_decimals.to_le_bytes();
        *start_emission_dst = start_emission.to_le_bytes();
        *init_timestamp_dst = init_timestamp.to_le_bytes();
        *decay_frequency_seconds_dst = decay_frequency_seconds.to_le_bytes();
        *end_slot_dst = end_slot.to_le_bytes();
        *nft_author_cnt_dst = nft_author_cnt.to_le_bytes();
        *total_nfts_dst = total_nfts.to_le_bytes();
        *max_stake_per_wallet_dst = max_stake_per_wallet.to_le_bytes();
        *max_stake_each_time_dst = max_stake_each_time.to_le_bytes();
        *unstake_batch_size_dst = unstake_batch_size.to_le_bytes();
        
        let mut buf_seeds:Vec<u8> = Vec::with_capacity(20 * 3);
        Self::pack_string_u8_len(&seed_pwdm, &mut buf_seeds);
        Self::pack_string_u8_len(&seed_pda_ciety, &mut buf_seeds);
        Self::pack_string_u8_len(&seed_pda_nft, &mut buf_seeds);
        let mut ind = 0usize;
        for u in buf_seeds.iter() {
            seeds_dst[ind] = *u;
            ind = ind + 1;
        }
        
        let mut buf_authors:Vec<u8> = Vec::with_capacity(10 * Self::MAX_NFT_AUTHORS);
        for author in nft_authors {
            buf_authors.extend(author.as_ref());
        }
        ind = 0usize;
        for u in buf_authors.iter() {
            nft_authors_dst[ind] = *u;
            ind = ind + 1;
        }
    }
}