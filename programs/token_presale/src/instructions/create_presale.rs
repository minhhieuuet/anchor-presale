use anchor_lang::prelude::*;

use crate::state::{PresaleDetails, WalletDetails};
use crate::constants::{PRESALE_SEED, WALLET_SEED};

// Create a new presale, initializing a new presale_details PDA
pub fn create_presale(
    ctx: Context<CreatePresale>,
    token_mint_address: Pubkey,
    token_amount: u64,
    price_per_token: u64,
    token_decimals: u32,
    min_buy_lamports: u64,
    ref_percentage: u64,
    start_sale_at: i64,
    end_sale_at: i64
) -> Result<()> {

    let presale = &mut ctx.accounts.presale_details;
    let wallet = &mut ctx.accounts.wallet_details;

    // Set the presale details to the parameters given
    presale.token_mint_address = token_mint_address;
    presale.token_amount = token_amount;
    presale.price_per_token = price_per_token;
    presale.sold_amount = 0;
    presale.token_decimals = token_decimals;
    presale.min_buy_lamports = min_buy_lamports;
    presale.ref_percentage = ref_percentage;
    presale.start_sale_at = start_sale_at;
    presale.end_sale_at = end_sale_at;
    presale.beneficiary = ctx.accounts.authority.key();
    presale.is_live = false;
    presale.is_claimable = false;
    presale.identifier = wallet.next_presale_identifier;
    presale.authority = ctx.accounts.authority.key();
    presale.bump = *ctx.bumps.get("presale_details").unwrap();

    // Increase the wallet's presale count
    wallet.next_presale_identifier = wallet.next_presale_identifier.checked_add(1).unwrap();

    msg!(
        "Created a presale for token: {}",
        presale.token_mint_address
    );

    Ok(())
}


#[derive(Accounts)]
#[instruction(
    token_mint_address: Pubkey,
    token_amount: u64,
    price_per_token: u64,
    token_decimals: u32,
    min_buy_lamports: u64,
    ref_percentage: u64,
    start_sale_at: i64,
    end_sale_at: i64
)]
pub struct CreatePresale<'info> {
    
    #[account(
        mut,
        seeds = [WALLET_SEED, authority.key().as_ref()],
        bump = wallet_details.bump
    )]
    pub wallet_details: Box<Account<'info, WalletDetails>>,
    
    // Initialize the presale_detils account
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + std::mem::size_of::<PresaleDetails>(),
        seeds = [PRESALE_SEED, authority.key().as_ref(), [wallet_details.next_presale_identifier].as_ref()],
        bump
    )]
    pub presale_details: Box<Account<'info, PresaleDetails>>,
    
    // Set the authority to the transaction signer
    #[account(mut)]
    pub authority: Signer<'info>,
    
    // Must be included when initializing an account
    pub system_program: Program<'info, System>,
}