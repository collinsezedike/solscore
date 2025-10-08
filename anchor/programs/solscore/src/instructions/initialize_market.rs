use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::Market;

pub fn _initialize_market(
    ctx: Context<InitializeMarket>,
    league_name: String,
    season: String,
    teams: Vec<String>,
    odds: Vec<u64>,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    market.set_inner(Market {
        admin: ctx.accounts.admin.key(),
        league_name: league_name,
        season: season,
        teams: teams,
        odds: odds,
        is_resolved: false,
        total_pool: 0,
        winning_team_index: None,
        bump: ctx.bumps.market,
        created_at: Clock::get()?.unix_timestamp,
        resolved_at: None,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(league_name: String, season: String)]
pub struct InitializeMarket<'info> {
    //Market Pda and also the authority for the vault
    #[account(
        init,
        payer = admin,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", league_name.as_bytes(), season.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    //vault token account where the funds will be stored
    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = market,
        associated_token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,

    // Token used - USDC(devnet...for now)
    pub mint: Account<'info, Mint>,

    //Admin Signing the transaction for initialization
    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}
