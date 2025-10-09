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

let alice: KeyPairSigner
let bob: KeyPairSigner
let john: KeyPairSigner

let aliceMarket: Address
let bobMarket: Address
let johnMarket: Address

let aliceMarketVault: Address
let bobMarketVault: Address
let johnMarketVault: Address

const aliceLeagueName = 'ALICE LEAGUE'
const aliceSeason = 'ALICE SEASON 1'
const aliceTeams = ['ALICE TEAM 1', 'ALICE TEAM 2', 'ALICE TEAM 3', 'ALICE TEAM 4']
const aliceOdds = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]

const bobLeagueName = 'BOB LEAGUE'
const bobSeason = 'BOB SEASON 1'
const bobTeams = ['BOB TEAM 1', 'BOB TEAM 2', 'BOB TEAM 3', 'BOB TEAM 4']
const bobOdds = [BigInt(2), BigInt(1), BigInt(3), BigInt(4)]

const johnLeagueName = 'JOHN LEAGUE'
const johnSeason = 'JOHN SEASON 1'
const johnTeams = ['JOHN TEAM 1', 'JOHN TEAM 2', 'JOHN TEAM 3', 'JOHN TEAM 4']
const johnOdds = [BigInt(3), BigInt(2), BigInt(1), BigInt(4)]

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: 'localnet',
})

describe('solscore', () => {
  before(async () => {
    alice = await createAndAidropSigner()
    bob = await createAndAidropSigner()
    john = await createAndAidropSigner()

    mint = await createAndMintToken([alice.address, bob.address, john.address])

    aliceMarket = await getMarketPDA(aliceLeagueName, aliceSeason)
    bobMarket = await getMarketPDA(bobLeagueName, bobSeason)
    johnMarket = await getMarketPDA(johnLeagueName, johnSeason)

    aliceMarketVault = await getAssociatedTokenAccountAddress(mint, aliceMarket)
    bobMarketVault = await getAssociatedTokenAccountAddress(mint, bobMarket)
    johnMarketVault = await getAssociatedTokenAccountAddress(mint, johnMarket)
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
      market: aliceMarket,
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

    const marketAccount = await solscoreClient.fetchMarket(rpc, aliceMarket)

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
})
