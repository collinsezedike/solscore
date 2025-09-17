// anchor/programs/solscore/src/state/bet.rs

use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub team_index: u8,
    pub amount: u64,
    pub claimed: bool,
    pub payout_amount: Option<u64>,
    pub timestamp: i64,
    pub claimed_at: Option<i64>,
    pub bump: u8,
}
