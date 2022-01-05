use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};
use std::collections::BTreeMap;
use std::convert::TryInto;
use std::mem::size_of;

pub struct Pwdm {
    pub is_initialized: bool,
    pub ciety: f64,
    pub nft_count: u16,
    pub unstake_start: u16,
}

pub struct Gcdm {
    pub is_initialized: bool,
    pub last_calc_slot: u16,
    pub global_nft_count: u16,
}

pub struct Gsdm {
    pub is_initialized: bool,
}

pub struct Rpdm {
    pub is_initialized: bool,
    pub count_to_calc: u16,
}

impl Sealed for Rpdm {}
impl IsInitialized for Rpdm {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Rpdm{
    pub const NEXT_IND:usize = 3usize;
    pub const REPEATED_SIZE:usize = 2 + 2;
}
impl Pack for Rpdm {
    /**
     * is_initialized, 1 byte
     * count_to_calc,  2 bytes
     * ===below repeated==
     * slot_nth,       2 bytes
     * nft_nth,        2 bytes
     */
    const LEN: usize = 1463;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let (is_initialized, rest) = src.split_at(1);
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        let (count_to_calc_bytes, rest) = rest.split_at(2);
        let count_to_calc_temp: [u8; 2] = count_to_calc_bytes.try_into().unwrap();
        let count_to_calc = u16::from_le_bytes(count_to_calc_temp);

        Ok(Rpdm {
            is_initialized: is_initialized,
            count_to_calc: count_to_calc,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let Rpdm {
            is_initialized,
            count_to_calc,
        } = self;

        let is_initialized = if *is_initialized {
            1u8.to_le_bytes()
        } else {
            0u8.to_le_bytes()
        };
        
        dst[0] = is_initialized[0];

        let count_to_calc_bytes = count_to_calc.to_le_bytes();
        dst[1] = count_to_calc_bytes[0];
        dst[2] = count_to_calc_bytes[1];
    }
}

impl Sealed for Pwdm {}
impl IsInitialized for Pwdm {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Pwdm{
    pub const NEXT_IND:usize = 13usize;
    pub const REPEATED_SIZE:usize = 32 + 32 + 2 + 8 + 2;
}
impl Pack for Pwdm {
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
    const LEN: usize = 7609;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let (is_initialized, rest) = src.split_at(1);
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        let (ciety_bytes, rest) = rest.split_at(8);
        let ciety_temp: [u8; 8] = ciety_bytes.try_into().unwrap();
        let ciety = f64::from_le_bytes(ciety_temp);
        
        let (cnft_count_bytes, rest) = rest.split_at(2);
        let nft_count_temp: [u8; 2] = cnft_count_bytes.try_into().unwrap();
        let nft_count = u16::from_le_bytes(nft_count_temp);

        let (unstake_start_bytes, rest) = rest.split_at(2);
        let unstake_start_temp: [u8; 2] = unstake_start_bytes.try_into().unwrap();
        let unstake_start = u16::from_le_bytes(unstake_start_temp);

        Ok(Pwdm {
            is_initialized: is_initialized,
            ciety: ciety,
            nft_count: nft_count,
            unstake_start: unstake_start,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let Pwdm {
            is_initialized,
            ciety,
            nft_count,
            unstake_start
        } = self;

        let is_initialized = if *is_initialized {
            1u8.to_le_bytes()
        } else {
            0u8.to_le_bytes()
        };
        
        dst[0] = is_initialized[0];

        let ciety_bytes = ciety.to_le_bytes();
        dst[1] = ciety_bytes[0];
        dst[2] = ciety_bytes[1];
        dst[3] = ciety_bytes[2];
        dst[4] = ciety_bytes[3];
        dst[5] = ciety_bytes[4];
        dst[6] = ciety_bytes[5];
        dst[7] = ciety_bytes[6];
        dst[8] = ciety_bytes[7];

        let nft_count_bytes = nft_count.to_le_bytes();
        dst[9] = nft_count_bytes[0];
        dst[10] = nft_count_bytes[1];

        let unstake_start_bytes = unstake_start.to_le_bytes();
        dst[11] = unstake_start_bytes[0];
        dst[12] = unstake_start_bytes[1];
    }
}


impl Sealed for Gcdm {}
impl IsInitialized for Gcdm {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Gcdm{
    pub const NEXT_IND:usize = 5usize;
    pub const REPEATED_SIZE:usize = 8 + 2 + 2;
}
impl Pack for Gcdm {
    /**
     * is_initialized,   1 byte
     * last_calc_slot,   2 bytes
     * global_nft_count, 2 bytes
     * ===below repeated==
     * nft_ciety,  8 bytes
     * start_slot, 2 bytes
     * end_slot,   2 bytees
     */
    const LEN: usize = 84005;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let (is_initialized, rest) = src.split_at(1);
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        let (last_calc_slot_bytes, rest) = rest.split_at(2);
        let last_calc_slot_temp: [u8; 2] = last_calc_slot_bytes.try_into().unwrap();
        let last_calc_slot = u16::from_le_bytes(last_calc_slot_temp);

        let (global_nft_count_bytes, rest) = rest.split_at(2);
        let global_nft_count_temp: [u8; 2] = global_nft_count_bytes.try_into().unwrap();
        let global_nft_count = u16::from_le_bytes(global_nft_count_temp);

        Ok(Gcdm {
            is_initialized: is_initialized,
            last_calc_slot: if last_calc_slot == 0 {9999} else {last_calc_slot} ,
            global_nft_count: global_nft_count,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let Gcdm {
            is_initialized,
            last_calc_slot,
            global_nft_count
        } = self;

        let is_initialized = if *is_initialized {
            1u8.to_le_bytes()
        } else {
            0u8.to_le_bytes()
        };
        
        dst[0] = is_initialized[0];

        let last_calc_slot_bytes = last_calc_slot.to_le_bytes();
        dst[1] = last_calc_slot_bytes[0];
        dst[2] = last_calc_slot_bytes[1];

        let global_nft_count_bytes = global_nft_count.to_le_bytes();
        dst[3] = global_nft_count_bytes[0];
        dst[4] = global_nft_count_bytes[1];
    }
}

impl Sealed for Gsdm {}
impl IsInitialized for Gsdm {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Gsdm {
    pub const NEXT_IND:usize = 1usize;
    pub fn repeated_size (total_nfts:u16) -> usize {
        let rtn = 2 + 2 + total_nfts * 1;
        return rtn as usize;
    }
}
impl Pack for Gsdm {
    /**
     * is_initialized, 1 byte
     * ===below repeated per slot==
     * nft_count, 2 bytes
     * nft_last_ind, 2 bytes
     * nft_nth, 1 bytes, 7000 bytes in total
     */
    const LEN: usize = 2556461; //for 365 days
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let (is_initialized, rest) = src.split_at(1);
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        Ok(Gsdm {
            is_initialized: true,
        })
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let Gsdm {
            is_initialized,
        } = self;

        let is_initialized = if *is_initialized {
            1u8.to_le_bytes()
        } else {
            0u8.to_le_bytes()
        };
        
        dst[0] = is_initialized[0];

    }
}

