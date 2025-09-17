// anchor/programs/solscore/src/lib.rs

pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

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

    //Place Bet - victor

    //Close Market - Niyi/Ebenezer - later on

    //Resolve Market - Niyi/Ebenezer - later on

    //Claim Payout - collins
}
