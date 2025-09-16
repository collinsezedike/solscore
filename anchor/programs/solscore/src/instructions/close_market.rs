use anchor_lang::prelude::*;

use crate::state::Market;

pub fn _close_market(_ctx: Context<CloseMarket>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(
        mut,
        has_one = admin,
        seeds = [b"market", market.league_name.as_bytes(), market.season.as_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}
