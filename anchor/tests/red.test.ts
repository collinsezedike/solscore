import { describe, it, before } from 'node:test'
import { expect } from 'chai'

import { Address, createSolanaClient, createTransaction, KeyPairSigner, signTransactionMessageWithSigners } from 'gill'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getAssociatedTokenAccountAddress,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from 'gill/programs'

import * as solscoreClient from '../src/client/js/generated'
import { createAndAidropSigner, createAndMintToken, getBetPDA, getMarketPDA } from './helpers'

let mint: Address

let bob: KeyPairSigner
let bobTokenAccount: Address
let bobMarketAccount: Address
let bobMarketVault: Address
let bobBetAccount: Address

let john: KeyPairSigner
let johnTokenAccount: Address
let johnBetAccount: Address

const bobLeagueName = 'BOB LEAGUE'
const bobSeason = 'BOB SEASON 1'
const bobTeams = ['BOB TEAM 1', 'BOB TEAM 2', 'BOB TEAM 3', 'BOB TEAM 4']
const bobOdds = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]
const bobAllowedBettors = BigInt(1)
const bobMaxStakeAmount = BigInt(100)
const bobWinningTeamIndex = 0

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: 'localnet',
})

describe('Red Tests', () => {
  before(async () => {
    bob = await createAndAidropSigner()
    john = await createAndAidropSigner()
  })

  describe('Initialize Market', () => {
    before(async () => {
      mint = await createAndMintToken([bob.address], 0)
      bobTokenAccount = await getAssociatedTokenAccountAddress(mint, bob)
      bobMarketAccount = await getMarketPDA(bobLeagueName, bobSeason)
      bobMarketVault = await getAssociatedTokenAccountAddress(mint, bobMarketAccount)
    })

    it('should fail if bob tries to create a market with empty teams and odds', async () => {
      let transactionFailedFlag = false
      const params: solscoreClient.InitializeMarketInput = {
        // Args
        leagueName: bobLeagueName,
        season: bobSeason,
        odds: [],
        teams: [],
        allowedBettors: bobAllowedBettors,
        maxStakeAmount: bobMaxStakeAmount,

        // Accounts
        admin: bob,
        adminTokenAccount: bobTokenAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getInitializeMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Market teams and odds vectors must not be empty',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })

    it('should fail if bob tries to create a market with teams and odds length mismatch', async () => {
      let transactionFailedFlag = false
      const params: solscoreClient.InitializeMarketInput = {
        // Args
        leagueName: bobLeagueName,
        season: bobSeason,
        odds: bobOdds.slice(1),
        teams: bobTeams,
        allowedBettors: bobAllowedBettors,
        maxStakeAmount: bobMaxStakeAmount,

        // Accounts
        admin: bob,
        adminTokenAccount: bobTokenAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getInitializeMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Market teams and odds vectors must have the same length',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })

    it('should fail if bob tries to create a market with insufficient balance to fund the vault', async () => {
      let transactionFailedFlag = false
      const params: solscoreClient.InitializeMarketInput = {
        // Args
        leagueName: bobLeagueName,
        season: bobSeason,
        odds: bobOdds,
        teams: bobTeams,
        allowedBettors: bobAllowedBettors,
        maxStakeAmount: bobMaxStakeAmount,

        // Accounts
        admin: bob,
        adminTokenAccount: bobTokenAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getInitializeMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('Error'))[0]).to.contain('insufficient funds')
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })
  })

  describe('Place Bet', () => {
    before(async () => {
      const highestOdd = bobOdds.reduce((max, current) => (current > max ? current : max))
      const amount = highestOdd * bobMaxStakeAmount * bobAllowedBettors
      mint = await createAndMintToken([bob.address, john.address], Number(amount) * 2)

      bobTokenAccount = await getAssociatedTokenAccountAddress(mint, bob)
      bobMarketAccount = await getMarketPDA(bobLeagueName, bobSeason)
      bobMarketVault = await getAssociatedTokenAccountAddress(mint, bobMarketAccount)

      johnTokenAccount = await getAssociatedTokenAccountAddress(mint, john)
      johnBetAccount = await getBetPDA(john.address, bobMarketAccount)

      // Initialize Bob's Market
      const params: solscoreClient.InitializeMarketInput = {
        // Args
        leagueName: bobLeagueName,
        season: bobSeason,
        odds: bobOdds,
        teams: bobTeams,
        allowedBettors: bobAllowedBettors,
        maxStakeAmount: bobMaxStakeAmount,

        // Accounts
        admin: bob,
        adminTokenAccount: bobTokenAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }
      const ix = solscoreClient.getInitializeMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()
      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })
      const signedTransaction = await signTransactionMessageWithSigners(tx)
      await sendAndConfirmTransaction(signedTransaction)
    })

    it('should fail if john tries to place a bet with 0 amount', async () => {
      let transactionFailedFlag = false
      const params: solscoreClient.PlaceBetInput = {
        // Args
        amount: 0,
        teamIndex: 0,

        // Accounts
        user: john,
        userTokenAccount: johnTokenAccount,
        bet: johnBetAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getPlaceBetInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: john,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Bet amount must be greater than zero and less than the market maximum stake amount',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })

    it('should fail if john tries to place a bet with amount greater than the max stake amount', async () => {
      let transactionFailedFlag = false

      const params: solscoreClient.PlaceBetInput = {
        // Args
        amount: bobMaxStakeAmount + BigInt(1),
        teamIndex: 0,

        // Accounts
        user: john,
        userTokenAccount: johnTokenAccount,
        bet: johnBetAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getPlaceBetInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: john,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })
      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Bet amount must be greater than zero and less than the market maximum stake amount',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })

    it('should fail if john tries to place a bet in a market with 0 allowed bettors', async () => {
      // First place a bet for bob
      {
        bobBetAccount = await getBetPDA(bob.address, bobMarketAccount)

        const params: solscoreClient.PlaceBetInput = {
          // Args
          amount: bobMaxStakeAmount,
          teamIndex: 0,

          // Accounts
          user: bob,
          userTokenAccount: bobTokenAccount,
          bet: bobBetAccount,
          market: bobMarketAccount,
          mint: mint,
          vault: bobMarketVault,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }

        const ix = solscoreClient.getPlaceBetInstruction(params)
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

        const tx = createTransaction({
          feePayer: bob,
          version: 'legacy',
          instructions: [ix],
          latestBlockhash,
        })

        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      }

      let transactionFailedFlag = false
      const params: solscoreClient.PlaceBetInput = {
        // Args
        amount: bobMaxStakeAmount,
        teamIndex: 0,

        // Accounts
        user: john,
        userTokenAccount: johnTokenAccount,
        bet: johnBetAccount,
        market: bobMarketAccount,
        mint: mint,
        vault: bobMarketVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getPlaceBetInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: john,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Market cannot accept any more bets',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })
  })

  describe('Resolve Market', () => {
    it('should fail if bob tries to resolve a market with an out-of-bounds index', async () => {
      let transactionFailedFlag = false
      const params: solscoreClient.ResolveMarketInput = {
        // Args
        winningTeamIndex: bobTeams.length,

        // Accounts
        admin: bob,
        market: bobMarketAccount,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getResolveMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Invalid team index',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })

    it('should fail if bob tries to resolve a market that has already been resolved', async () => {
      // First resolve the market
      {
        const params: solscoreClient.ResolveMarketInput = {
          // Args
          winningTeamIndex: bobWinningTeamIndex,

          // Accounts
          admin: bob,
          market: bobMarketAccount,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
        }

        const ix = solscoreClient.getResolveMarketInstruction(params)
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

        const tx = createTransaction({
          feePayer: bob,
          version: 'legacy',
          instructions: [ix],
          latestBlockhash,
        })

        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      }

      let transactionFailedFlag = false
      const params: solscoreClient.ResolveMarketInput = {
        // Args
        winningTeamIndex: bobWinningTeamIndex,

        // Accounts
        admin: bob,
        market: bobMarketAccount,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
      }

      const ix = solscoreClient.getResolveMarketInstruction(params)
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      const tx = createTransaction({
        feePayer: bob,
        version: 'legacy',
        instructions: [ix],
        latestBlockhash,
      })

      try {
        const signedTransaction = await signTransactionMessageWithSigners(tx)
        await sendAndConfirmTransaction(signedTransaction)
      } catch (error: any) {
        transactionFailedFlag = true
        expect(error.context.logs.filter((log: string) => log.includes('AnchorError'))[0]).to.contain(
          'Market has already been resolved',
        )
      } finally {
        expect(transactionFailedFlag).to.be.true
      }
    })
  })
})
