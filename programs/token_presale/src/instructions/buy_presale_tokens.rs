use ::{ anchor_lang::prelude::* };
use crate::errors::TodoError;
use crate::state::PresaleDetails;
use crate::state::BuyerPresaleDetails;
use crate::constants::{ PRESALE_SEED, BUYER_SEED };
use solana_program::{
    system_instruction,
    clock::Clock,
};

pub fn buy_presale_tokens(
    ctx: Context<BuyPresaleTokens>,
    lamport_amounts: u64,
    presale_identifier: u8,
    presale_authority: Pubkey,
    ref_by: Pubkey
) -> Result<()> {
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    let buyer = &ctx.accounts.buyer;
    let ref_by_account = &ctx.accounts.ref_by;
    let presale_details_pda = &mut ctx.accounts.presale_details_pda;
    let presale_authority_account = &ctx.accounts.presale_authority;

    let buyer_presale_details = &mut ctx.accounts.buyer_presale_details;
    require!(presale_authority_account.key == &presale_authority, TodoError::InvalidAuthority);
    require!(presale_details_pda.is_live == true, TodoError::SaleNotLive);
    require!(lamport_amounts >= presale_details_pda.min_buy_lamports, TodoError::LowerThanMinBuy);
    if presale_details_pda.start_sale_at > 0 && presale_details_pda.end_sale_at > 0 {
        require!(current_timestamp >= presale_details_pda.start_sale_at  && current_timestamp <= presale_details_pda.end_sale_at, TodoError::NotInSaleTime);
    }

    if buyer_presale_details.ref_by != Pubkey::default() {
        msg!("buyer_presale_details.ref_by: {}", buyer_presale_details.ref_by);
        msg!("ref_by: {}", ref_by);
        // require!(buyer_presale_details.ref_by == ref_by, TodoError::InvalidRefBy);
        // require!(ref_by_account.key == &buyer_presale_details.ref_by, TodoError::InvalidRefBy);
    } else {
        buyer_presale_details.ref_by = ref_by;
        buyer_presale_details.buyer = *buyer.key;
        buyer_presale_details.ref_count = 0;
        buyer_presale_details.bump = *ctx.bumps.get("buyer_presale_details").unwrap();
    }

    msg!("Transferring quote tokens to presale {}...", presale_identifier);
    // transfer 80% to presale authority and 20% to ref_by
    let ref_amount = (lamport_amounts * presale_details_pda.ref_percentage) / 100_00;
    let beneficiary_amount = lamport_amounts - ref_amount;

    let transfer_to_beneficiary_instruction = system_instruction::transfer(
        buyer.key,
        &presale_details_pda.beneficiary,
        beneficiary_amount
    );
    anchor_lang::solana_program::program::invoke_signed(
        &transfer_to_beneficiary_instruction,
        &[
            buyer.to_account_info(),
            ctx.accounts.beneficiary.clone(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[]
    )?;

    let transfer_to_ref_by_instruction = system_instruction::transfer(
        buyer.key,
        ref_by_account.key,
        ref_amount
    );
    anchor_lang::solana_program::program::invoke_signed(
        &transfer_to_ref_by_instruction,
        &[
            buyer.to_account_info(),
            ref_by_account.clone(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[]
    )?;
    let amount_token_receive = lamport_amounts / presale_details_pda.price_per_token;
    let amount_token_receive_with_decimals = amount_token_receive * (10u64).pow(presale_details_pda.token_decimals);
    require!(presale_details_pda.sold_amount + amount_token_receive_with_decimals <= presale_details_pda.token_amount, TodoError::SoldOut);

    msg!("Amount of token receive: {}", amount_token_receive_with_decimals);

    buyer_presale_details.claimable_tokens += amount_token_receive_with_decimals;
    presale_details_pda.sold_amount += amount_token_receive_with_decimals;


    msg!("Claimable tokens: {}", buyer_presale_details.claimable_tokens);

    Ok(())
}

#[derive(Accounts)]
#[instruction(lamport_amounts: u64,
    presale_identifier: u8,
    presale_authority: Pubkey,
    ref_by: Pubkey)]
pub struct BuyPresaleTokens<'info> {
    #[account(
        mut,
        seeds = [PRESALE_SEED, presale_authority.key().as_ref(), [presale_identifier].as_ref()],
        bump = presale_details_pda.bump,
        constraint = 
                presale_details_pda.beneficiary == *beneficiary.key 
                // && presale_details_pda.is_live == true 
    )]
    pub presale_details_pda: Box<Account<'info, PresaleDetails>>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub ref_by: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub presale_authority: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<BuyerPresaleDetails>(),
        seeds = [
            BUYER_SEED,
            presale_authority.key().as_ref(),
            [presale_identifier].as_ref(),
            buyer.key.as_ref(),
        ],
        bump
    )]
    pub buyer_presale_details: Box<Account<'info, BuyerPresaleDetails>>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
