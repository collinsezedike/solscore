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

    pub fn place_bet(
    ctx: Context<PlaceBet>,
    team_index: u8,
    amount: u64,
    ) -> Result<()> {
        _place_bet(ctx, team_index, amount)
    }

    //Close Market - Niyi/Ebenezer - later on

    //Resolve Market - Niyi/Ebenezer - later on

    //Claim Payout - collins

}

    #[error_code]
    pub enum BettingError {
        #[msg("Market is closed for betting")]
        MarketClosed,
        #[msg("Market has already been resolved")]
        MarketResolved,
        #[msg("Bet amount must be greater than zero")]
        InvalidBetAmount,
        #[msg("Insufficient USDC balance")]
        InsufficientBalance,
        #[msg("Invalid team index")]
        InvalidTeamIndex,
        #[msg("Mathematical overflow")]
        MathOverflow,
    }