use anchor_lang::prelude::*;
use anchor_lang::InitSpace;
use anchor_spl::token::{self, TokenAccount, Mint, Token, Transfer, CloseAccount};

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod solscore {
    use super::*;
    
    //Function for creating Market
    pub fn create_market(ctx: Context<InitializeMarket>, 
        league_name: String,
        season: String,
        team: Vec<String>,
        odds: Vec<u64>
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.admin = ctx.accounts.admin.key();
        market.league_name = league_name;
        market.season = season;
        market.teams = team;
        market.odds = odds;
        market.is_closed = false;
        market.is_resolved = false;
        market.total_pool = 0;
        market.winning_team_index = None;
        market.vault_bump = ctx.bumps.vault;
        market.created_at = Clock::get()?.unix_timestamp;
        market.resolved_at = None;
        msg!("Market initialized: {} {}", market.league_name, market.season);
        Ok(())
    }

    //Place Bet - victor

    //Close Market - Niyi/Ebenezer - later on

    //Resolve Market - Niyi/Ebenezer - later on

    //Claim Payout - collins
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

    //vault token account, used spl token the is where the funds will be stored
    #[account(
        init,
        payer = admin,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = market
    )]
    pub vault: Account<'info, TokenAccount>,

    //type of token used - USDC(devnet...for now)
    pub mint: Account<'info, Mint>,
    
    //Admin Signing the transaction for initialization
    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(
        mut,
        has_one = admin
    )]
    pub market: Account<'info, Market>,
    
    pub admin: Signer<'info>
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = admin
    )]
    pub market: Account<'info, Market>,

    pub admin: Signer<'info>
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint, 
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        token::mint = mint,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        has_one = user, 
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        token::mint = mint, 
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>
}

//Struct for market Pda
#[account]
#[derive(InitSpace)]
pub struct Market {
    pub admin: Pubkey,
    #[max_len(50)]
    pub league_name: String,
    #[max_len(20)]
    pub season: String,
    #[max_len(25, 50)]
    pub teams: Vec<String>,
    #[max_len(30)]
    pub odds: Vec<u64>,
    pub is_closed: bool,
    pub is_resolved: bool,
    pub winning_team_index: Option<u8>,
    pub total_pool: u64,
    pub vault_bump: u8,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
}

//Struct for bet Pda
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
}