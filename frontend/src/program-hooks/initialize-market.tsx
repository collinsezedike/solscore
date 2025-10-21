import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useMutation } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Solscore } from "@/idlTypes/idlType";
import { toast } from "sonner";

const mintAddress = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

interface CreateMarketParams {
  leagueName: string;
  season: string;
  teams: string[];
  odds: number[];
  maxStakeAmount: number;
  allowedBettors: number;
}

export const useInitializeMarket = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const initializeMarket = async ({
    leagueName,
    season,
    teams,
    odds,
    maxStakeAmount,
    allowedBettors,
  }: CreateMarketParams) => {
    if (!wallet || !publicKey) throw new Error("Wallet not connected!");
    if (!leagueName || !season) throw new Error("leagueName and season required!");

    try {
      const programId = new PublicKey("4g9MJ1aapgPqZXzX1gSdURyYw5prhpRkff6KJ4mfBdnK");
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program(idl, provider);
      
      const mintAddressPubKey = new PublicKey(mintAddress);
      const userAddressPubKey = publicKey;

      const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(String(leagueName)), Buffer.from(String(season))],
        programId
      );

      const vault = await getAssociatedTokenAddress(mintAddressPubKey, marketPDA, true);
      const adminTokenAccount = await getAssociatedTokenAddress(mintAddressPubKey, userAddressPubKey);

      console.log("Vault:", vault.toBase58());
      console.log("Admin ATA:", adminTokenAccount.toBase58());
      console.log("Market PDA:", marketPDA.toBase58());
        console.log(programId.toBase58());

      // Convert numbers to BN (BigNumber) 
      const maxStakeAmountBN = new BN(maxStakeAmount);
      const allowedBettorsBN = new BN(allowedBettors);
      
      // Convert odds array to BN array if needed
      const oddsBN = odds.map(odd => new BN(odd));

      const tx = await program.methods
        .initializeMarket(
          leagueName, 
          season, 
          teams, 
          oddsBN,
          maxStakeAmountBN,  
          allowedBettorsBN 
        )
        .accounts({
          market: marketPDA,
          vault,
          mint: mintAddressPubKey,
          admin: userAddressPubKey,
          adminTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
await connection.confirmTransaction(
  { signature: tx, ...(await connection.getLatestBlockhash()) },
  "confirmed"
);
      console.log("Market created successfully:", tx);
      return tx;

    } catch (error: unknown) {
      const err = error as Error & { logs?: string[] };
      console.error("Error initializing market:", err);
      
      if (err.logs) {
        console.error("Transaction logs:", err.logs);
      }
      
      throw error;
    }
  };
  
  const { mutateAsync: createMarket, data, isPending } = useMutation({
    mutationFn: initializeMarket,
    onSuccess: (data: any) => {
      toast.success("Market initialized successfully!", {
        description: `Transaction: ${data}`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data}?cluster=devnet`, "_blank"),
        },
      });
    },
    onError: (error: any) => {
      console.error("Market initialization failed:", error.message);
      toast.error(`Failed to create market: ${error.message}`);
    },
  });

  return { createMarket, data, isPending };
};