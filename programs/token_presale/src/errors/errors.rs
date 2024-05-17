use anchor_lang::prelude::*;

// Not yet implemented

#[error_code]
pub enum TodoError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Not allowed")]
    NotAllowed,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Already marked")]
    AlreadyMarked,
    #[msg("Invalid ref_by")]
    InvalidRefBy,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Sale is not live")]
    SaleNotLive,
    #[msg("Sale is not claimable")]
    SaleNotClaimable,
    #[msg("Lower than min buy")]
    LowerThanMinBuy,
    #[msg("Sold out")]
    SoldOut,
    #[msg("Not in sale time")]
    NotInSaleTime
}