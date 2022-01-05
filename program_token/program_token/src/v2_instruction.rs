use solana_program::{msg, program_error::ProgramError};
use std::convert::TryInto;
use std::mem::size_of;

use borsh::{BorshDeserialize, BorshSerialize};
use crate::v2_error::{SolmateCommonError::InvalidInstruction};

pub enum SolmateInsV2 {
    /// Configure the Solmate project.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` The account storing project configurations.
    ///   2. `[writable]` The account where $CIETY is escrowed.
    ///   3. `[]` TOKEN_PROGRAM_ID.
    ///   4. `[]` SYSVAR_RENT_PUBKEY.
    ///   5. `[]` $CIETY mint.
    ///   6. `[]` Gsdm.
    ///   7. `[]` Gcdm.
    ///   8. `[]` Rpdm.
    InsConfig{
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
        seed_pda_nft: String
    },

    /// Transfer $CIETY to stakers' wallet
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` The account where $CIETY is escrowed.
    ///   2. `[writable]` The account of $CIETY receiver of a staker.
    ///   3. `[]` PDA for the account where $CIETY is escrowed.
    ///   4. `[]` TOKEN_PROGRAM_ID.
    ///   5. `[]` $CIETY mint.
    ///   6. `[]` The account storing project configurations.
    InsTransferCiety{amount:u64}
}

impl SolmateInsV2 {

    /// Unpacks a byte buffer into a [MintInstruction].
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0u8 => {
                let (rest, stake_min_days) = Self::unpack_u16(rest)?;
                let (rest, stake_max_days) = Self::unpack_u16(rest)?;
                let (rest, emission_total_days) = Self::unpack_u16(rest)?;
                let (rest, ciety_decimals) = Self::unpack_u8(rest)?;
                let (rest, start_emission) = Self::unpack_u32(rest)?;
                let (rest, decay_frequency_seconds) = Self::unpack_u32(rest)?;
                let (rest, total_nfts) = Self::unpack_u16(rest)?;
                let (rest, max_stake_per_wallet) = Self::unpack_u16(rest)?;
                let (rest, max_stake_each_time) = Self::unpack_u16(rest)?;
                let (rest, nft_author_cnt) = Self::unpack_u8(rest)?;
                let (rest, pwdm_size) = Self::unpack_u16(rest)?;
                let (rest, unstake_batch_size) = Self::unpack_u8(rest)?;
                let (rest, seed_pwdm) = Self::unpack_string_u8_len(rest)?;
                let (rest, seed_pda_ciety) = Self::unpack_string_u8_len(rest)?;
                let (rest, seed_pda_nft) = Self::unpack_string_u8_len(rest)?;
                Self::InsConfig {
                    stake_min_days: stake_min_days,
                    stake_max_days: stake_max_days,
                    emission_total_days: emission_total_days,
                    ciety_decimals: ciety_decimals,
                    start_emission: start_emission,
                    decay_frequency_seconds: decay_frequency_seconds,
                    total_nfts: total_nfts,
                    max_stake_per_wallet: max_stake_per_wallet,
                    max_stake_each_time: max_stake_each_time,
                    nft_author_cnt: nft_author_cnt,
                    pwdm_size: pwdm_size,
                    unstake_batch_size: unstake_batch_size,
                    seed_pwdm: seed_pwdm,
                    seed_pda_ciety: seed_pda_ciety,
                    seed_pda_nft: seed_pda_nft,
                }
            },
            1u8 => {
                let (rest, amount) = Self::unpack_u64(rest)?;
                Self::InsTransferCiety{
                    amount: amount,
                }
            },
            _ => {
                return Err(InvalidInstruction.into())
            }
        })
    }

    fn unpack_string_u8_len(input: &[u8]) -> Result<(&[u8], String), ProgramError> {
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

    fn unpack_string(input: &[u8]) -> Result<(&[u8], String), ProgramError> {
        let (len_bytes, rest) = input.split_at(2);
        let temp:[u8;2] = len_bytes.try_into().unwrap();
        let len = u16::from_le_bytes(temp) as usize;
        let name = rest
            .get(..len)
            .and_then(|slice| slice.try_into().ok())
            .map(std::str::from_utf8)
            .ok_or(InvalidInstruction)?;
        
        Ok((rest.split_at(len).1, String::from(name.unwrap())))
    }

    fn unpack_f32(input: &[u8]) -> Result<(&[u8], f32), ProgramError> {
        let (num_bytes, rest) = input.split_at(4);
        let temp:[u8;4] = num_bytes.try_into().unwrap();
        let num = f32::from_le_bytes(temp);
        Ok((rest, num as f32))
    }

    fn unpack_u64(input: &[u8]) -> Result<(&[u8], u64), ProgramError> {
        let (num_bytes, rest) = input.split_at(8);
        let temp:[u8;8] = num_bytes.try_into().unwrap();
        let num = u64::from_le_bytes(temp) as usize;
        Ok((rest, num as u64))
    }

    fn unpack_u32(input: &[u8]) -> Result<(&[u8], u32), ProgramError> {
        let (num_bytes, rest) = input.split_at(4);
        let temp:[u8;4] = num_bytes.try_into().unwrap();
        let num = u32::from_le_bytes(temp) as usize;
        Ok((rest, num as u32))
    }

    fn unpack_u16(input: &[u8]) -> Result<(&[u8], u16), ProgramError> {
        let (num_bytes, rest) = input.split_at(2);
        let temp:[u8;2] = num_bytes.try_into().unwrap();
        let num = u16::from_le_bytes(temp) as usize;
        Ok((rest, num as u16))
    }

    fn unpack_u8(input: &[u8]) -> Result<(&[u8], u8), ProgramError> {
        let (num_bytes, rest) = input.split_at(1);
        let temp:[u8;1] = num_bytes.try_into().unwrap();
        let num = u8::from_le_bytes(temp) as usize;
        Ok((rest, num as u8))
    }

    fn unpack_string_vec(input: &[u8]) -> Result<(&[u8], Vec<String>), ProgramError> {
        let (rest, len) = Self::unpack_u32(input)?;

        let mut rtn:Vec<String> = Vec::new();
        let mut rest1 = rest;
        for _ in 0..len{
            let (rest2, uri) = Self::unpack_string(rest1)?;
            rtn.push(uri);
            rest1 = rest2;
        }
        Ok((&rest1, rtn))
    }

    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(size_of::<Self>());
        match self {
            Self::InsConfig {
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
                buf.push(0u8);
                self.pack_u16(stake_min_days, &mut buf);
                self.pack_u16(stake_max_days, &mut buf);
                self.pack_u16(emission_total_days, &mut buf);
                self.pack_u8(ciety_decimals, &mut buf);
                self.pack_u32(start_emission, &mut buf);
                self.pack_u32(decay_frequency_seconds, &mut buf);
                self.pack_u16(total_nfts, &mut buf);
                self.pack_u16(max_stake_per_wallet, &mut buf);
                self.pack_u16(max_stake_each_time, &mut buf);
                self.pack_u8(nft_author_cnt, &mut buf);
                self.pack_u16(pwdm_size, &mut buf);
                self.pack_u8(unstake_batch_size, &mut buf);
                self.pack_string_u8_len(seed_pwdm, &mut buf);
                self.pack_string_u8_len(seed_pda_ciety, &mut buf);
                self.pack_string_u8_len(seed_pda_nft, &mut buf);
            }
            Self::InsTransferCiety{amount} =>{
                buf.push(1u8);
                self.pack_u64(amount, &mut buf);
            }
        };
        buf
    }

    fn pack_string_u8_len(&self, value:&String, buf:&mut Vec<u8>){
        let bytes = value.as_bytes();
        buf.extend((bytes.len() as u8).to_le_bytes().to_vec().into_iter());
        buf.extend(bytes.to_vec().into_iter());
    }

    fn pack_string(&self, value:&String, buf:&mut Vec<u8>){
        let bytes = value.as_bytes();
        buf.extend((bytes.len() as u16).to_le_bytes().to_vec().into_iter());
        buf.extend(bytes.to_vec().into_iter());
    }

    fn pack_f32(&self, value:&f32, buf:&mut Vec<u8>){
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }

    fn pack_u64(&self, value:&u64, buf:&mut Vec<u8>){
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }

    fn pack_u32(&self, value:&u32, buf:&mut Vec<u8>){
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }

    fn pack_u16(&self, value:&u16, buf:&mut Vec<u8>){
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }

    fn pack_u8(&self, value:&u8, buf:&mut Vec<u8>){
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }

    fn pack_string_vec(&self, value:&Vec<String>, buf:&mut Vec<u8>){
        let len:u32 = value.len() as u32;
        buf.extend(len.to_le_bytes().to_vec().into_iter());
        for v in value {
            self.pack_string(v, buf);
        }
    }
}