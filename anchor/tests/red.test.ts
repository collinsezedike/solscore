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
import { createAndAidropSigner, createAndMintToken, getMarketPDA } from './helpers'

let mint: Address

let bob: KeyPairSigner
let bobTokenAccount: Address
let bobMarketAccount: Address
let bobMarketVault: Address

// let bob: KeyPairSigner
// let bobTokenAccount: Address
// let bobBetAccount: Address

const bobLeagueName = 'BOB LEAGUE'
const bobSeason = 'BOB SEASON 1'
const bobTeams = ['BOB TEAM 1', 'BOB TEAM 2', 'BOB TEAM 3', 'BOB TEAM 4']
const bobOdds = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]
const bobAllowedBettors = BigInt(10)
const bobMaxStakeAmount = BigInt(100)
// const bobWinningTeamIndex = 0

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: 'localnet',
})

describe('Red Tests', () => {
  describe('Initialize Market', () => {
    before(async () => {
      bob = await createAndAidropSigner()

      mint = await createAndMintToken([bob.address], 0.001)

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
})
