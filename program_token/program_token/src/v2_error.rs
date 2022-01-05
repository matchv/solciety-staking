use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum SolmateTokenError {
    /// Not Rent Exempt
    #[error("Not Rent Exempt for Account ConfigDM")]
    NotRentExempt_ConfigDM,
    
    /// Project is not initialized
    #[error("Project not initialized")]
    ProjNotInitialized,

    /// First account is not a signer
    #[error("First account is not a signer")]
    FirstAccountNotASigner,

    /// First account is not the initializer
    #[error("First account is the initializer")]
    FirstAccountNotInitializer,

    /// Max NFT authors limit is exceeded 
    #[error("Max NFT authors limit is exceeded")]
    MaxNFTAuthorLimitExceeded,

    /// Configure account size is not right
    #[error("Configure account size is not right")]
    ConfigAccountWrongSize,

    
}

impl From<SolmateTokenError> for ProgramError {
    fn from(e: SolmateTokenError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

#[derive(Error, Debug, Copy, Clone)]
pub enum SolmateCommonError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<SolmateCommonError> for ProgramError {
    fn from(e: SolmateCommonError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
