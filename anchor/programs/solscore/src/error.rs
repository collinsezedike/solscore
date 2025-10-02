use anchor_lang::prelude::*;

#[error_code]
pub enum SolscoreError {
    #[msg("Market is already closed for betting")]
    MarketClosed,
    #[msg("Market has not been closed")]
    MarketNotClosed,
    #[msg("Market has already been resolved")]
    MarketResolved,
    #[msg("Market has not been resolved")]
    MarketNotResolved,
    #[msg("Bet amount must be greater than zero")]
    InvalidBetAmount,
    #[msg("Bet has already been claimed")]
    BetClaimed,
    #[msg("Insufficient USDC balance")]
    InsufficientBalance,
    #[msg("Invalid team index")]
    InvalidTeamIndex,
    #[msg("Mathematical overflow")]
    MathOverflow,
}
