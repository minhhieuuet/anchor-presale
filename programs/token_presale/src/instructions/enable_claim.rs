use anchor_lang::prelude::*;

use crate::state::PresaleDetails;
use crate::constants::PRESALE_SEED;

// Edit the details for a presale
pub fn enable_claim(
    ctx: Context<EnableClaim>,
    _presale_identifier: u8,
    is_claimable: bool
) -> Result<()> {
    
    let presale = &mut ctx.accounts.presale_details;

    // Set the presale details to the parameters given
    presale.is_claimable = is_claimable;

    msg!(
        "Claimable status changed for : {}",
        presale.token_mint_address
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    presale_identifier: u8,
)]
pub struct EnableClaim<'info> {
    
    #[account(
        mut,
        seeds = [PRESALE_SEED, authority.key().as_ref(), [presale_identifier].as_ref()],
        bump = presale_details.bump
    )]
    pub presale_details: Box<Account<'info, PresaleDetails>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,

}