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

let alice: KeyPairSigner
let aliceMarketAccount: Address
let aliceMarketVault: Address

let bob: KeyPairSigner
let bobTokenAccount: Address
let bobBetAccount: Address

const aliceLeagueName = 'ALICE LEAGUE'
const aliceSeason = 'ALICE SEASON 1'
const aliceTeams = ['ALICE TEAM 1', 'ALICE TEAM 2', 'ALICE TEAM 3', 'ALICE TEAM 4']
const aliceOdds = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]
const aliceWinningTeamIndex = 0

const bobBetTeamIndex = 0
const bobBetAmount = BigInt(100)

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: 'localnet',
})

describe('solscore', () => {
  before(async () => {
    alice = await createAndAidropSigner()
    bob = await createAndAidropSigner()

    mint = await createAndMintToken([bob.address])

    aliceMarketAccount = await getMarketPDA(aliceLeagueName, aliceSeason)
    aliceMarketVault = await getAssociatedTokenAccountAddress(mint, aliceMarketAccount)

    bobTokenAccount = await getAssociatedTokenAccountAddress(mint, bob)
    bobBetAccount = await getBetPDA(bob.address, aliceMarketAccount)
  })

  it('should initialize alice market', async () => {
    const params: solscoreClient.InitializeMarketInput = {
      // Args
      leagueName: aliceLeagueName,
      season: aliceSeason,
      odds: aliceOdds,
      teams: aliceTeams,

      // Accounts
      admin: alice,
      market: aliceMarketAccount,
      mint: mint,
      vault: aliceMarketVault,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
      systemProgram: SYSTEM_PROGRAM_ADDRESS,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }

    const ix = solscoreClient.getInitializeMarketInstruction(params)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    const tx = createTransaction({
      feePayer: alice,
      version: 'legacy',
      instructions: [ix],
      latestBlockhash,
    })

    const signedTransaction = await signTransactionMessageWithSigners(tx)
    await sendAndConfirmTransaction(signedTransaction)

    const marketAccount = await solscoreClient.fetchMarket(rpc, aliceMarketAccount)

    expect(marketAccount.data.admin.toString() == alice.address.toString())
    expect(marketAccount.data.leagueName == aliceLeagueName)
    expect(marketAccount.data.season == aliceSeason)
    expect(marketAccount.data.teams).lengthOf(aliceTeams.length)
    expect(marketAccount.data.teams).to.include.all.members(aliceTeams)
    expect(marketAccount.data.odds).lengthOf(aliceOdds.length)
    expect(marketAccount.data.odds).to.include.all.members(aliceOdds)
    expect(marketAccount.data.winningTeamIndex.__option).to.equal('None')
    expect(marketAccount.data.isResolved).to.be.false
    expect(marketAccount.data.resolvedAt.__option).to.be.equal('None')
    expect(marketAccount.data.totalPool == BigInt(0))
  })

  it("should place bob's bet in alice market", async () => {
    const marketAccountBefore = await solscoreClient.fetchMarket(rpc, aliceMarketAccount)
    const marketPoolBefore = marketAccountBefore.data.totalPool

    const params: solscoreClient.PlaceBetInput = {
      // Args
      teamIndex: bobBetTeamIndex,
      amount: bobBetAmount,

      // Accounts
      bet: bobBetAccount,
      user: bob,
      userTokenAccount: bobTokenAccount,
      market: aliceMarketAccount,
      mint: mint,
      vault: aliceMarketVault,
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

    const betAccount = await solscoreClient.fetchBet(rpc, bobBetAccount)

    expect(betAccount.data.user.toString() == bob.address.toString())
    expect(betAccount.data.market.toString() == aliceMarketAccount.toString())
    expect(betAccount.data.teamIndex == bobBetTeamIndex)
    expect(betAccount.data.amount == bobBetAmount)
    expect(betAccount.data.payoutAmount).to.deep.equal({
      __option: 'Some',
      value: bobBetAmount * aliceOdds[bobBetTeamIndex],
    })

    const marketAccountAfter = await solscoreClient.fetchMarket(rpc, aliceMarketAccount)
    const marketPoolAfter = marketAccountAfter.data.totalPool

    expect(marketPoolAfter).to.be.equal(marketPoolBefore + bobBetAmount)
  })

  it('should resolve alice market', async () => {
    const params: solscoreClient.ResolveMarketInput = {
      // Args
      winningTeamIndex: aliceWinningTeamIndex,

      // Accounts
      admin: alice,
      market: aliceMarketAccount,
      systemProgram: SYSTEM_PROGRAM_ADDRESS,
    }

    const ix = solscoreClient.getResolveMarketInstruction(params)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    const tx = createTransaction({
      feePayer: alice,
      version: 'legacy',
      instructions: [ix],
      latestBlockhash,
    })

    const signedTransaction = await signTransactionMessageWithSigners(tx)
    await sendAndConfirmTransaction(signedTransaction)

    const marketAccount = await solscoreClient.fetchMarket(rpc, aliceMarketAccount)

    expect(marketAccount.data.isResolved).to.be.true
    expect(marketAccount.data.resolvedAt.__option).to.not.equal('None')
    expect(marketAccount.data.winningTeamIndex).to.deep.equal({ __option: 'Some', value: aliceWinningTeamIndex })
  })

  it("should claim payout from bob's bet in alice market", async () => {
    let accountFetchFailedFlag = false
    const params: solscoreClient.ClaimPayoutInput = {
      // Args

      // Accounts
      bet: bobBetAccount,
      user: bob,
      userTokenAccount: bobTokenAccount,
      market: aliceMarketAccount,
      mint: mint,
      vault: aliceMarketVault,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
      systemProgram: SYSTEM_PROGRAM_ADDRESS,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }

    const ix = solscoreClient.getClaimPayoutInstruction(params)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    const tx = createTransaction({
      feePayer: bob,
      version: 'legacy',
      instructions: [ix],
      latestBlockhash,
    })

    const signedTransaction = await signTransactionMessageWithSigners(tx)
    await sendAndConfirmTransaction(signedTransaction)

    try {
      await solscoreClient.fetchBet(rpc, bobBetAccount)
    } catch (error: any) {
      accountFetchFailedFlag = true
      expect(error.message).to.contain('Account not found')
    } finally {
      expect(accountFetchFailedFlag).to.be.true
    }
  })

  it('should close alice market', async () => {
    let accountFetchFailedFlag = false
    const params: solscoreClient.CloseMarketInput = {
      // Args

      // Accounts
      admin: alice,
      market: aliceMarketAccount,
      systemProgram: SYSTEM_PROGRAM_ADDRESS,
    }

    const ix = solscoreClient.getCloseMarketInstruction(params)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    const tx = createTransaction({
      feePayer: alice,
      version: 'legacy',
      instructions: [ix],
      latestBlockhash,
    })

    const signedTransaction = await signTransactionMessageWithSigners(tx)
    await sendAndConfirmTransaction(signedTransaction)

    try {
      await solscoreClient.fetchMarket(rpc, aliceMarketAccount)
    } catch (error: any) {
      accountFetchFailedFlag = true
      expect(error.message).to.contain('Account not found')
    } finally {
      expect(accountFetchFailedFlag).to.be.true
    }
  })
})
