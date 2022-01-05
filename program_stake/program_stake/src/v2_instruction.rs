use solana_program::program_error::ProgramError;
use std::convert::TryInto;
use std::mem::size_of;
use solmate_program_token::v2_error::SolmateCommonError::InvalidInstruction;

pub enum SolmateInsV2 {    
    /// Transfer $CIETY to stakers' wallet
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Pwdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[writable]` Gsdm.
    ///   4. `[]` TOKEN_PROGRAM_ID.
    ///   5. `[]` SYSVAR_RENT_PUBKEY.
    ///   6. `[]` The account storing project configurations.
    ///   7. `[signer]` Staker wallet.
    ///   8. `[]` Solmate token program.
    InsStake { time_length_days: u16, nft_num: u16 },
    
    /// Calculate rewards in $CIETY for each staked NFT given
    /// the slot index and start and end NFT index on the slot.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Rpdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[writable]` Gsdm.
    ///   4. `[]` The account storing project configurations.
    ///   5. `[]` Solmate token program.
    InsRewardCalc { start:u16, end:u16, slot:u16},
    
    /// Calculate a staker's rewards in $CIETY and store it in Pwdm.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Pwdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[]` The account storing project configurations.
    ///   4. `[]` Solmate token program.
    InsRewardView { },
    
    /// Calculate a staker's rewards and send $CIETY to his wallet,
    /// no matter whether or not all his NFTs are on due.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` The account where $CIETY is escrowed.
    ///   2. `[writable]` Pwdm.
    ///   3. `[writable]` Gcdm.
    ///   4. `[]` TOKEN_PROGRAM_ID.
    ///   5. `[]` SYSVAR_RENT_PUBKEY.
    ///   6. `[]` The account storing project configurations.
    ///   7. `[signer]` Staker wallet.
    ///   8. `[]` Solmate token program.
    ///   9. `[writable]` The account of $CIETY receiver of a staker.
    ///   10. `[]` $CIETY mint.
    ///   11. `[]` PDA for the account where $CIETY is escrowed.
    InsRewardClaim { },
    
    /// Unstake all NFTs of a staker if all his NFTs are on due.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Pwdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[]` The account storing project configurations.
    ///   4. `[]` Solmate token program.
    InsUnstake { },

    /// Exend the staking time length of all NFTs of a staker 
    /// which are not on due with given time length to increase
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Pwdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[writable]` Gsdm.
    ///   4. `[]` The account storing project configurations.
    ///   5. `[]` Solmate token program.
    InsAddTiemLength { time_length_days: u16 },

    /// Be prepared for calculating rewards for all NFTs,
    /// periodically called by reward calculation trigger.
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Rpdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[writable]` Gsdm.
    ///   4. `[]` The account storing project configurations.
    ///   5. `[]` Solmate token program.
    InsRewardPrep {curr_slot: u16},

    /// Check if a staker's all NFTs are on due,
    /// this is called first before really unstaking
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[signer]` The account of project initializer.
    ///   1. `[writable]` Pwdm.
    ///   2. `[writable]` Gcdm.
    ///   3. `[]` The account storing project configurations.
    ///   4. `[]` Solmate token program.
    InsCheckExpiration { },
}

impl SolmateInsV2 {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => {
                let (rest, time_length_days) = Self::unpack_u16(rest)?;
                let (rest, nft_num) = Self::unpack_u16(rest)?;
                Self::InsStake {
                    time_length_days: time_length_days,
                    nft_num: nft_num
                }
            },
            1 => {
                let (rest, start) = Self::unpack_u16(rest)?;
                let (rest, end) = Self::unpack_u16(rest)?;
                let (rest, slot) = Self::unpack_u16(rest)?;
                Self::InsRewardCalc {
                    start:start,
                    end:end,
                    slot:slot,
                }
            },
            2 => Self::InsRewardView {},
            3 => Self::InsUnstake {},
            4 => {
                let (rest, time_length_days) = Self::unpack_u16(rest)?;
                Self::InsAddTiemLength {
                    time_length_days: time_length_days,
                }
            },
            5 => {
                let (rest, curr_slot) = Self::unpack_u16(rest)?;
                Self::InsRewardPrep{curr_slot:curr_slot}
            },
            6 => Self::InsCheckExpiration{ },
            7 => Self::InsRewardClaim {},
            _ => return Err(InvalidInstruction.into()),
        })
    }

    fn unpack_u16(input: &[u8]) -> Result<(&[u8], u16), ProgramError> {
        let (num_bytes, rest) = input.split_at(2);
        let temp: [u8; 2] = num_bytes.try_into().unwrap();
        let num = u16::from_le_bytes(temp) as usize;
        Ok((rest, num as u16))
    }

    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(size_of::<Self>());
        match self {
            Self::InsStake { time_length_days, nft_num } => {}
            Self::InsRewardCalc {start, end, slot} => {}
            Self::InsRewardView {} => {}
            Self::InsRewardClaim {} => {}
            Self::InsUnstake {} => {}
            Self::InsAddTiemLength {time_length_days} => {}
            Self::InsRewardPrep {curr_slot} => {}
            Self::InsCheckExpiration {} => {}
        };
        buf
    }
    
    fn pack_u16(&self, value: &u16, buf: &mut Vec<u8>) {
        buf.extend(value.to_le_bytes().to_vec().into_iter());
    }
}
