use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum SolmateStakeError {
    /// Time length is too short
    #[error("Time length too short")]
    TimeLengthTooShort,

    /// Time length is too long
    #[error("Time length too long")]
    TimeLengthTooLong,

    /// Project is not initialized
    #[error("Project not initialized")]
    ProjNotInitialized,

    /// First account is not a signer
    #[error("First account is not a signer")]
    FirstAccountNotASigner,

    /// First account is not the initializer
    #[error("First account is the initializer")]
    FirstAccountNotInitializer,

    /// NFT has wrong authority
    #[error("NFT has wrong authority")]
    NFTWrongAuthority,

    /// Not Rent Exempt
    #[error("Not Rent Exempt for Pwdm")]
    NotRentExempt_Pwdm,

    /// Not Rent Exempt
    #[error("Not Rent Exempt for Gcdm")]
    NotRentExempt_Gcdm,

    /// Not Rent Exempt
    #[error("Not Rent Exempt for Gsdm")]
    NotRentExempt_Gsdm,

    /// Cannot unstake during staking
    #[error("Cannot unstake during staking")]
    StakingNotFinished,

    /// Amount overflow
    #[error("Amount overflow")]
    AmountOverflow,

    /// Cannot increase time length on expired NFT
    #[error("Cannot increase time length on expired NFT")]
    CannotIncreaseTimeLengthOnExpiredNFT,

    /// Exceed the max number of stake NFTs per wallet
    #[error("Exceed the max number of stake NFTs per wallet")]
    ExceedMaxStakePerWallet,

    /// Exceed the max number of stake NFTs eache time
    #[error("Exceed the max number of stake NFTs eache time")]
    ExceedMaxNftEachTime,

    /// Given end_nft_ind is larger than last_nft_ind stored in slot
    #[error("Given end_nft_ind is larger than last_nft_ind stored in slot")]
    EndNftIndOutOfRange,    

    /// Unstake limit is exceeded
    #[error("Unstake limit is exceeded")]
    UnstakeLimitExceeded,

    /// Gcdm account size is not right
    #[error("Gcdm account size is not right")]
    GcdmAccountWrongSize,

    /// Gcdm does not have enough SOLs for rent exemption
    #[error("Gcdm does not have enough SOLs for rent exemption")]
    GcdmNotRentExempted,

    /// Gsdm account size is not right
    #[error("Gsdm account size is not right")]
    GsdmAccountWrongSize,

    /// Gsdm does not have enough SOLs for rent exemption
    #[error("Gsdm does not have enough SOLs for rent exemption")]
    GsdmNotRentExempted,

    /// Pwdm account size is not right
    #[error("Pwdm account size is not right")]
    PwdmAccountWrongSize,

    /// Pwdm does not have enough SOLs for rent exemption
    #[error("Pwdm does not have enough SOLs for rent exemption")]
    PwdmNotRentExempted,

    /// Rpdm account size is not right
    #[error("Rpdm account size is not right")]
    RpdmAccountWrongSize,

    /// Rpdm does not have enough SOLs for rent exemption
    #[error("Rpdm does not have enough SOLs for rent exemption")]
    RpdmNotRentExempted,

    /// The given current slot is larger than the project's max_stake_days
    #[error("The given current slot is larger than the project's max_stake_days")]
    CurrentSlotLargerThanProjStakeMaxDays,

    /// The predefined total_nfts in project config can't be exceeded when staking
    #[error("The predefined total_nfts in project config can't be exceeded when staking")]
    TotalNFTSExceeded,

    /// The staking start_slot can't be larger than the project's max_stake_days
    #[error("The staking start_slot can't be larger than the project's max_stake_days")]
    StakingStartSlotLargerThanProjStakeMaxDays,  

    /// The given slot to calc can't be larger than the pre-defined stake_max_days
    #[error("The given slot to calc can't be larger than the pre-defined stake_max_days")]
    GvienSlotToCalcLargerThanProjStakeMaxDays,

    /// OverflowOnU16
    #[error("OverflowOnU16")]
    OverflowOnU16,

    /// OverflowOnUsize
    #[error("OverflowOnUsize")]
    OverflowOnUsize,

    /// OverflowOnU64
    #[error("OverflowOnU64")]
    OverflowOnU64,

    /// OverflowOnF64
    #[error("OverflowOnF64")]
    OverflowOnF64, 
    
    
    
}

impl From<SolmateStakeError> for ProgramError {
    fn from(e: SolmateStakeError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

