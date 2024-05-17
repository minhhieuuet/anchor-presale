use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PresaleDetails {
    // Mint address of the presale token
    pub token_mint_address: Pubkey,
    // Total amount of presale tokens available in the presale
    pub token_amount: u64,
    // Sold amount of tokens
    pub sold_amount: u64,
    // Mint buy lamports
    pub min_buy_lamports: u64,
    // Quote token per presale token
    pub price_per_token: u64,
    // token decimals
    pub token_decimals: u32,
    // Presale is claimable
    pub is_claimable: bool,
    // Presale is buyable
    pub is_live: bool,
    // Ref percentage
    pub ref_percentage: u64,
    // start sale at
    pub start_sale_at: i64,
    // end sale at
    pub end_sale_at: i64,
    // Beneficiary of the presale
    pub beneficiary: Pubkey,
    // Identifier for finding the PDA
    pub identifier: u8,
    // Authority of the presale
    pub authority: Pubkey,
    // Bump used when creating the PDA
    pub bump: u8
}