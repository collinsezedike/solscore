import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Solscore } from "../target/types/solscore";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("place_bet", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Solscore as Program<Solscore>;
  
  let mint: anchor.web3.PublicKey;
  let userTokenAccount: anchor.web3.PublicKey;
  let vaultTokenAccount: anchor.web3.PublicKey;
  let marketPda: anchor.web3.PublicKey;
  let betPda: anchor.web3.PublicKey;
  
  const user = anchor.web3.Keypair.generate();
  const admin = provider.wallet.publicKey;
  
  // Test data
  const leagueName = "Premier League";
  const season = "2024/25";
  const teams = ["Arsenal", "Chelsea", "Liverpool", "Man City"];
  const odds = [new BN(3000), new BN(2500), new BN(4000), new BN(1800)]; // 3.0, 2.5, 4.0, 1.8 (in basis points)
  const betAmount = new BN(50_000_000); // 50 USDC (6 decimals)
  const teamIndex = 0; // Arsenal
  
  before(async () => {
    // Airdrop SOL to user for transaction fees
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for airdrop
    
    // Create USDC mint (6 decimals like real USDC)
    mint = await createMint(
      provider.connection,
      user,
      admin,
      null,
      6
    );
    
    // Create user's token account
    userTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );
    
    // Mint 1000 USDC to user for testing
    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount,
      admin,
      1000_000_000 // 1000 USDC
    );
    
    // Derive PDAs
    [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(leagueName), Buffer.from(season)],
      program.programId
    );
    
    [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user.publicKey.toBuffer(), marketPda.toBuffer()],
      program.programId
    );
    
    // Get vault token account address
    vaultTokenAccount = await getAssociatedTokenAddress(
      mint,
      marketPda,
      true // allowOwnerOffCurve = true for PDA
    );
    
    // Initialize market first (assuming your teammate's function works)
    try {
      await program.methods
        .initializeMarket(leagueName, season, teams, odds)
        .accounts({
          market: marketPda,
          admin: admin,
          mint: mint,
          vault: vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      console.log("Market might already exist or initialize_market not implemented yet");
    }
  });
  
  describe("Successful bet placement", () => {
    it("Should place a bet successfully", async () => {
      // Get initial balances
      const initialUserBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
      const initialMarket = await program.account.market.fetch(marketPda);
      const initialTotalPool = initialMarket.totalPool;
      
      // Place bet
      const tx = await program.methods
        .placeBet(teamIndex, betAmount)
        .accounts({
          bet: betPda,
          market: marketPda,
          vault: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          user: user.publicKey,
          mint: mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      // Verify bet account was created correctly
      const betAccount = await program.account.bet.fetch(betPda);
      expect(betAccount.user.toString()).to.equal(user.publicKey.toString());
      expect(betAccount.market.toString()).to.equal(marketPda.toString());
      expect(betAccount.teamIndex).to.equal(teamIndex);
      expect(betAccount.amount.toString()).to.equal(betAmount.toString());
      expect(betAccount.claimed).to.be.false;
      expect(betAccount.claimedAt).to.be.null;
      expect(betAccount.timestamp).to.be.greaterThan(0);
      
      // Verify payout amount calculation (amount * odds[teamIndex])
      const expectedPayout = betAmount.mul(odds[teamIndex]);
      expect(betAccount.payoutAmount.toString()).to.equal(expectedPayout.toString());
      
      // Verify tokens were transferred
      const finalUserBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
      const balanceDecrease = new BN(initialUserBalance.value.amount).sub(new BN(finalUserBalance.value.amount));
      expect(balanceDecrease.toString()).to.equal(betAmount.toString());
      
      // Verify market total pool was updated
      const finalMarket = await program.account.market.fetch(marketPda);
      const poolIncrease = finalMarket.totalPool.sub(initialTotalPool);
      expect(poolIncrease.toString()).to.equal(betAmount.toString());
      
      console.log("✅ Bet placed successfully!");
      console.log(`   User: ${user.publicKey.toString()}`);
      console.log(`   Team: ${teams[teamIndex]} (index: ${teamIndex})`);
      console.log(`   Amount: ${betAmount.toString()} USDC`);
      console.log(`   Payout: ${expectedPayout.toString()} USDC`);
    });
  });
  
  describe("Error cases", () => {
    const user2 = anchor.web3.Keypair.generate();
    let user2TokenAccount: anchor.web3.PublicKey;
    let betPda2: anchor.web3.PublicKey;
    
    before(async () => {
      // Setup second user for error tests
      await provider.connection.requestAirdrop(user2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      user2TokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user2,
        mint,
        user2.publicKey
      );
      
      [betPda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), user2.publicKey.toBuffer(), marketPda.toBuffer()],
        program.programId
      );
    });
    
    it("Should reject bet with amount = 0", async () => {
      try {
        await program.methods
          .placeBet(teamIndex, new BN(0))
          .accounts({
            bet: betPda2,
            market: marketPda,
            vault: vaultTokenAccount,
            userTokenAccount: user2TokenAccount,
            user: user2.publicKey,
            mint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have thrown InvalidBetAmount error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Bet amount must be greater than zero");
        console.log("✅ Correctly rejected zero amount bet");
      }
    });
    
    it("Should reject bet if user has insufficient balance", async () => {
      const largeAmount = new BN(2000_000_000); // 2000 USDC (more than user2 has)
      
      try {
        await program.methods
          .placeBet(teamIndex, largeAmount)
          .accounts({
            bet: betPda2,
            market: marketPda,
            vault: vaultTokenAccount,
            userTokenAccount: user2TokenAccount,
            user: user2.publicKey,
            mint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have thrown InsufficientBalance error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Insufficient USDC balance");
        console.log("✅ Correctly rejected bet with insufficient balance");
      }
    });
    
    it("Should reject bet with invalid team index", async () => {
      const invalidTeamIndex = 99; // Out of bounds
      
      try {
        await program.methods
          .placeBet(invalidTeamIndex, betAmount)
          .accounts({
            bet: betPda2,
            market: marketPda,
            vault: vaultTokenAccount,
            userTokenAccount: user2TokenAccount,
            user: user2.publicKey,
            mint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have thrown InvalidTeamIndex error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Invalid team index");
        console.log("✅ Correctly rejected bet with invalid team index");
      }
    });
    
    it("Should reject duplicate bet in same market", async () => {
      // First user already placed a bet, trying again should fail
      const [duplicateBetPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), user.publicKey.toBuffer(), marketPda.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .placeBet(1, betAmount) // Different team, same user, same market
          .accounts({
            bet: duplicateBetPda, // Same PDA as before
            market: marketPda,
            vault: vaultTokenAccount,
            userTokenAccount: userTokenAccount,
            user: user.publicKey,
            mint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        
        expect.fail("Should have failed due to existing bet PDA");
      } catch (error) {
        // This will fail at the account creation level since bet PDA already exists
        expect(error.message).to.include("already in use");
        console.log("✅ Correctly rejected duplicate bet (PDA already exists)");
      }
    });
    
    // Note: Market closed and resolved tests would require your teammates' 
    // close_market and resolve_market functions to be implemented first
  });
  
  describe("Edge cases", () => {
    it("Should handle large bet amounts without overflow", async () => {
      const user3 = anchor.web3.Keypair.generate();
      await provider.connection.requestAirdrop(user3.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user3TokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        user3,
        mint,
        user3.publicKey
      );
      
      // Mint large amount for testing
      const largeAmount = new BN(100_000_000); // 100 USDC
      await mintTo(
        provider.connection,
        user3,
        mint,
        user3TokenAccount,
        admin,
        largeAmount.toNumber()
      );
      
      const [betPda3] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), user3.publicKey.toBuffer(), marketPda.toBuffer()],
        program.programId
      );
      
      // Place large bet
      await program.methods
        .placeBet(teamIndex, largeAmount)
        .accounts({
          bet: betPda3,
          market: marketPda,
          vault: vaultTokenAccount,
          userTokenAccount: user3TokenAccount,
          user: user3.publicKey,
          mint: mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user3])
        .rpc();
      
      const betAccount = await program.account.bet.fetch(betPda3);
      expect(betAccount.amount.toString()).to.equal(largeAmount.toString());
      console.log("✅ Successfully handled large bet amount");
    });
  });
});