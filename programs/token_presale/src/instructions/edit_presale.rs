use anchor_lang::prelude::*;

use crate::state::PresaleDetails;
use crate::constants::PRESALE_SEED;

// Edit the details for a presale
pub fn edit_presale(
    ctx: Context<EditPresale>,
    _presale_identifier: u8,
    token_amount: u64,
    price_per_token: u64,
    token_decimals: u32,
    ref_percentage: u64,
    start_sale_at: i64,
    end_sale_at: i64,
    beneficiary: Pubkey
) -> Result<()> {
    
    let presale = &mut ctx.accounts.presale_details;

    // Set the presale details to the parameters given
    presale.token_amount = token_amount;
    presale.price_per_token = price_per_token;
    presale.token_decimals = token_decimals;
    presale.ref_percentage = ref_percentage;
    presale.start_sale_at = start_sale_at;
    presale.end_sale_at = end_sale_at;
    presale.beneficiary = beneficiary;

    msg!(
        "Edited the presale details for token: {}",
        presale.token_mint_address
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    presale_identifier: u8,
    token_amount: u64,
    price_per_token: u64,
    token_decimals: u32,
    ref_percentage: u64,
    start_sale_at: i64,
    end_sale_at: i64,
    beneficiary: Pubkey
)]
pub struct EditPresale<'info> {
    
    #[account(
        mut,
        seeds = [PRESALE_SEED, authority.key().as_ref(), [presale_identifier].as_ref()],
        bump = presale_details.bump
    )]
    pub presale_details: Box<Account<'info, PresaleDetails>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,

}