import { SOLSCORE_PROGRAM_ADDRESS } from '../src/client/js/generated/programs'
import { address, Address, createSolanaClient, generateKeyPairSigner, getProgramDerivedAddress } from 'gill'

import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

const { rpc } = createSolanaClient({ urlOrMoniker: 'localnet' })

export const createAndAidropSigner = async () => {
  let keyPair = await generateKeyPairSigner()
  await rpc.requestAirdrop(keyPair.address, 5_000_000_000 as any).send()
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return keyPair
}

export const createAndMintToken = async (testAddresses: Address[]): Promise<Address> => {
  const feePayer = Keypair.generate()
  const connection = new Connection('http://localhost:8899', 'confirmed')
  const airdropSignature = await connection.requestAirdrop(feePayer.publicKey, 2 * LAMPORTS_PER_SOL)
  const latestBlockhash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({
    signature: airdropSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  })

  const mint = await createMint(connection, feePayer, feePayer.publicKey, null, 6)

  for (let testAddress of testAddresses) {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, feePayer, mint, new PublicKey(testAddress))
    await mintTo(connection, feePayer, mint, tokenAccount.address, feePayer, 10000 * 10 ** 6)
  }

  return address(mint.toBase58())
}

export const getMarketPDA = async (leagueName: string, season: string): Promise<Address> => {
  const [marketPDA, _bump] = await getProgramDerivedAddress({
    programAddress: SOLSCORE_PROGRAM_ADDRESS,
    seeds: [Buffer.from('market'), leagueName, season],
  })
  return marketPDA
}
