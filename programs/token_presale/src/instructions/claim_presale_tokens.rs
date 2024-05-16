use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token,
        associated_token,
    },
};
use crate::errors::TodoError;
use crate::state::PresaleDetails;
use crate::state::BuyerPresaleDetails;
use crate::constants::{PRESALE_SEED, BUYER_SEED};

pub fn claim_presale_tokens(
    ctx: Context<ClaimPresaleTokens>,
    presale_identifier: u8,
    presale_authority: Pubkey,
) -> Result<()> {
    let buyer_presale_details = &mut ctx.accounts.buyer_presale_details;
    let bump = &[ctx.accounts.presale_details_pda.bump];
    let presale_details_pda = &ctx.accounts.presale_details_pda;
    require!(presale_details_pda.is_claimable == true, TodoError::SaleNotClaimable);
    msg!("Claiming presale tokens for presale {}...", presale_identifier);
    msg!("Claimable tokens: {}", buyer_presale_details.claimable_tokens);
    // Transfer the tokens to the buyer
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.presale_associated_token_account.to_account_info(),
                to: ctx.accounts.buyer_associated_token_account.to_account_info(),
                authority: ctx.accounts.presale_details_pda.to_account_info(),
            },
            &[&[b"PRESALE_SEED", presale_authority.as_ref(), &[presale_identifier], bump][..]],
        ),
        buyer_presale_details.claimable_tokens,
    )?;
    msg!("Tokens claimed successfully.");
    buyer_presale_details.claimable_tokens = 0;

    Ok(())
}


#[derive(Accounts)]
#[instruction(presale_identifier: u8, presale_authority: Pubkey)]
pub struct ClaimPresaleTokens<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED, presale_authority.key().as_ref(), [presale_identifier].as_ref()],
        bump = presale_details_pda.bump,
        // constraint = presale_details_pda.is_claimable == true 
    )]
    pub presale_details_pda: Box<Account<'info, PresaleDetails>>,
    #[account(mut)]
    pub mint_account: Account<'info, token::Mint>,
    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = buyer,
    )]
    pub buyer_associated_token_account: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = presale_details_pda,
    )]
    pub presale_associated_token_account: Account<'info, token::TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<BuyerPresaleDetails>(),
        seeds = [BUYER_SEED, presale_authority.key().as_ref(), [presale_identifier].as_ref(), buyer.key.as_ref()],
        bump
    )]
    pub buyer_presale_details: Box<Account<'info, BuyerPresaleDetails>>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}