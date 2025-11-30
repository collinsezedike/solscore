import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useMutation } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
// import { Solscore } from "@/idlTypes/idlType";
import { toast } from "sonner";

const mintAddress = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

interface CloseMarketParams {
  marketPublicKey: string;
  leagueName: string;
  season: string;
}

export const useCloseMarket = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const closeMarket = async ({
    marketPublicKey,
    leagueName,
    season,
  }: CloseMarketParams) => {
    if (!wallet || !publicKey) throw new Error("Wallet not connected!");
    if (!marketPublicKey || !leagueName || !season) {
      throw new Error("Missing required parameters!");
    }

    try {
      // const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program(idl, provider);
      
      const mintAddressPubKey = new PublicKey(mintAddress);
      const adminPubKey = publicKey;
      const marketPDA = new PublicKey(marketPublicKey);

      // Get associated token addresses
      const vault = await getAssociatedTokenAddress(
        mintAddressPubKey, 
        marketPDA, 
        true 
      );
      
      const adminTokenAccount = await getAssociatedTokenAddress(
        mintAddressPubKey, 
        adminPubKey
      );

      console.log("Closing market:", {
        market: marketPDA.toBase58(),
        vault: vault.toBase58(),
        adminTokenAccount: adminTokenAccount.toBase58(),
        admin: adminPubKey.toBase58(),
      });

      // Call close_market instruction
      const tx = await program.methods
        .closeMarket()
        .accounts({
          market: marketPDA,
          mint: mintAddressPubKey,
          vault,
          adminTokenAccount,
          admin: adminPubKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(
        { signature: tx, ...(await connection.getLatestBlockhash()) },
        "confirmed"
      );

      console.log("Market closed successfully:", tx);
      return tx;

    }catch (error: unknown) {
    const err = error as Error & { 
        message?: string 
    };
    
    if (err.message?.includes("already been processed")) {
        console.warn("Transaction was already processed - this might be a false error");
        // If you know the transaction succeeded, you might want to return a success status
        return "Transaction completed (already processed)";
    }
    console.error("Close market failed:", err);
    throw error; 
}
  };

  const { mutateAsync: executeCloseMarket, data, isPending, isError, error } = useMutation({
    mutationFn: closeMarket,
    onSuccess: (data: any) => {
      toast.success("Market closed successfully!", {
        description: `All remaining funds transferred to admin`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data}?cluster=devnet`, "_blank"),
        },
      });
    },
    onError: (error: any) => {
      console.error("Market closure failed:", error.message);
      toast.error(`Failed to close market: ${error.message}`);
    },
  });

  return { 
    closeMarket: executeCloseMarket, 
    data, 
    isPending, 
    isError, 
    error 
  };
};