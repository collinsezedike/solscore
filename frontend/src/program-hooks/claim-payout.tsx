import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useMutation } from "@tanstack/react-query";
import {Buffer} from "buffer"
import idl from "@/idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
// import { Solscore } from "@/idlTypes/idlType";
import { toast } from "sonner";

const mintAddress = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const PROGRAM_ID = "4g9MJ1aapgPqZXzX1gSdURyYw5prhpRkff6KJ4mfBdnK";

interface ClaimPayoutParams {
  marketPublicKey: string;
  leagueName: string;
  season: string;
}

export const useClaimPayout = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const claimPayout = async ({
    marketPublicKey,
    leagueName,
    season,
  }: ClaimPayoutParams) => {
    if (!wallet || !publicKey) throw new Error("Wallet not connected!");
    if (!marketPublicKey || !leagueName || !season) {
      throw new Error("Missing required parameters!");
    }

    try {
      const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program(idl, provider);
      
      const mintAddressPubKey = new PublicKey(mintAddress);
      const userAddressPubKey = publicKey;
      const marketPDA = new PublicKey(marketPublicKey);

      // Derive the bet PDA
      const [betPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), userAddressPubKey.toBuffer(), marketPDA.toBuffer()],
        programId
      );

      // Get associated token addresses
      const vault = await getAssociatedTokenAddress(
        mintAddressPubKey, 
        marketPDA, 
        true // allowOwnerOffCurve
      );
      
      const userTokenAccount = await getAssociatedTokenAddress(
        mintAddressPubKey, 
        userAddressPubKey
      );

      console.log("Claiming payout:", {
        bet: betPDA.toBase58(),
        market: marketPDA.toBase58(),
        vault: vault.toBase58(),
        userTokenAccount: userTokenAccount.toBase58(),
      });

      const tx = await program.methods
        .claimPayout()
        .accounts({
          market: marketPDA,
          vault,
          bet: betPDA,
          userTokenAccount,
          user: userAddressPubKey,
          mint: mintAddressPubKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(
        { signature: tx, ...(await connection.getLatestBlockhash()) },
        "confirmed"
      );

      console.log("Payout claimed successfully:", tx);
      return tx;

    } catch (error: unknown) {
      const err = error as Error & { logs?: string[] };
      console.error("Error claiming payout:", err);
      
      if (err.logs) {
        console.error("Transaction logs:", err.logs);
      }
      
      // Parse common errors
      if (err.message.includes("MarketNotResolved")) {
        throw new Error("This market has not been resolved yet");
      } else if (err.message.includes("BetNotWon")) {
        throw new Error("Your bet did not win. Only winning bets can claim payouts");
      } else if (err.message.includes("AccountNotInitialized")) {
        throw new Error("No bet found for this market");
      }
      
      throw error;
    }
  };

  const { mutateAsync: executeClaimPayout, data, isPending, isError, error } = useMutation({
    mutationFn: claimPayout,
    onSuccess: (data: any) => {
      toast.success("Payout claimed successfully!", {
        description: `Your winnings have been transferred to your wallet`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data}?cluster=devnet`, "_blank"),
        },
      });
    },
    onError: (error: any) => {
      console.error("Claim payout failed:", error.message);
      toast.error(`Failed to claim payout: ${error.message}`);
    },
  });

  return { 
    claimPayout: executeClaimPayout, 
    data, 
    isPending, 
    isError, 
    error 
  };
};