use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::error::SolscoreError;
use crate::state::{Bet, Market};

pub fn _place_bet(ctx: Context<PlaceBet>, team_index: u8, amount: u64) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let bet = &mut ctx.accounts.bet;
    let user = &ctx.accounts.user;
    let vault = &ctx.accounts.vault;
    let user_token_account = &ctx.accounts.user_token_account;
    let token_program = &ctx.accounts.token_program;

    // Validation Rule 1: Market must not be resolved
    require!(!market.is_resolved, SolscoreError::MarketResolved);

    // Validation Rule 2: Stake amount > 0
    require!(amount > 0, SolscoreError::InvalidBetAmount);

    // Validation Rule 3: User must have sufficient USDC balance
    require!(
        user_token_account.amount >= amount,
        SolscoreError::InsufficientBalance
    );

    // Validate team_index is within bounds
    require!(
        (team_index as usize) < market.teams.len(),
        SolscoreError::InvalidTeamIndex
    );

    // Validate team_index is within odds bounds
    require!(
        (team_index as usize) < market.odds.len(),
        SolscoreError::InvalidTeamIndex
    );

    // Get current timestamp
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    // Calculate payout amount using fixed odds
    let odds = market.odds[team_index as usize];
    let payout_amount = amount
        .checked_mul(odds)
        .ok_or(SolscoreError::MathOverflow)?;

    // Initialize bet account with all required data
    bet.set_inner(Bet {
        user: user.key(),
        market: market.key(),
        team_index: team_index,
        amount: amount,
        payout_amount: Some(payout_amount),
        timestamp: current_timestamp,
        bump: ctx.bumps.bet,
    });

    // Transfer USDC from user to vault
    let transfer_accounts = Transfer {
        from: user_token_account.to_account_info(),
        to: vault.to_account_info(),
        authority: user.to_account_info(),
    };
    let transfer_ctx = CpiContext::new(token_program.to_account_info(), transfer_accounts);
    token::transfer(transfer_ctx, amount)?;

    // Update market's total pool
    market.total_pool = market
        .total_pool
        .checked_add(amount)
        .ok_or(SolscoreError::MathOverflow)?;

    msg!(
        "Bet placed: User {}, Market {}, Team Index {}, Amount {}, Payout Amount {}",
        user.key(),
        market.key(),
        team_index,
        amount,
        payout_amount
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(team_index: u8, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"market", market.league_name.as_bytes(), market.season.as_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}
