use anchor_lang::prelude::*;

use crate::error::SolscoreError;

use crate::state::{Bet, Market};

pub fn _close_market(ctx: Context<CloseMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(!market.is_closed, SolscoreError::MarketClosed);
    // Market should be resolved before closing
    require!(market.is_resolved, SolscoreError::MarketNotResolved);
    market.is_closed=true;
    msg!("Market closed for betting: {} {}", market.league_name, market.season);
    Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(
        mut,
        has_one = admin,
        seeds = [b"market", market.league_name.as_bytes(), market.season.as_bytes()],
        bump = market.bump,
        // Simple method for closing account and returnning rent back to admin
        close=admin
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}
