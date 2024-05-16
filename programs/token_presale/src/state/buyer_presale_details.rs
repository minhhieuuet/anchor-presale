use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BuyerPresaleDetails {
    pub ref_by: Pubkey,
    pub buyer: Pubkey,
    pub ref_count: u64,
    pub claimable_tokens: u64,
    // Bump used when creating the PDA
    pub bump: u8
}