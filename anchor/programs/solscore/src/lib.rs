pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod solscore {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        league_name: String,
        season: String,
        teams: Vec<String>,
        odds: Vec<u64>,
    ) -> Result<()> {
        _initialize_market(ctx, league_name, season, teams, odds)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, team_index: u8, amount: u64) -> Result<()> {
        _place_bet(ctx, team_index, amount)
    }

    //Close Market - Niyi/Ebenezer - later on
    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        _close_market(ctx)
    }
    //Resolve Market - Niyi/Ebenezer - later on
    pub fn resolve_market(ctx: Context<ResolveMarket>, winning_team_index:u8) -> Result<()> {
        _resolve_market(ctx, winning_team_index)
    }


    //Claim Payout - collins
}
