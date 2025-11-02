import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Solscore } from "@/idlTypes/idlType";
import { toast } from "sonner";

// const PROGRAM_ID = "4g9MJ1aapgPqZXzX1gSdURyYw5prhpRkff6KJ4mfBdnK";

interface ResolveMarketParams {
  marketPublicKey: string;
  winningTeamIndex: number ;
}

export const useResolveMarket = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const resolveMarket = async ({
    marketPublicKey,
    winningTeamIndex,
  }: ResolveMarketParams) => {
    if (!wallet || !publicKey) throw new Error("Wallet not connected!");
    if (!marketPublicKey || winningTeamIndex === undefined) {
      throw new Error("Missing required parameters!");
    }

    try {
      // const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);
      
      const marketPDA = new PublicKey(marketPublicKey);
      const adminPubKey = publicKey;

      console.log("Resolving market:", {
        marketPDA: marketPDA.toBase58(),
        admin: adminPubKey.toBase58(),
        winningTeamIndex,
      });

      // Call resolve_market instruction
      const tx = await program.methods
        .resolveMarket(winningTeamIndex)
        .accounts({
          market: marketPDA,
          admin: adminPubKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(
        { signature: tx, ...(await connection.getLatestBlockhash()) },
        "confirmed"
      );

      console.log("Market resolved successfully:", tx);
      return tx;

    } catch (error: unknown) {
    const err = error as Error & { 
        message?: string 
    };
    
    if (err.message?.includes("already been processed")) {
        console.warn("Transaction was already processed - this might be a false error");
        // If you know the transaction succeeded, you might want to return a success status
        return "Transaction completed (already processed)";
    }
    console.error("Resolve market failed:", err);
    throw error; 
}
  };

  const { mutateAsync: executeResolveMarket, data, isPending, isError, error } = useMutation({
    mutationFn: resolveMarket,
    onSuccess: (data: any) => {
      toast.success("Market resolved successfully!", {
        description: `Transaction confirmed`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data}?cluster=devnet`, "_blank"),
        },
      });
    },
    onError: (error: any) => {
      console.error("Market resolution failed:", error.message);
      toast.error(`Failed to resolve market: ${error.message}`);
    },
  });

  return { 
    resolveMarket: executeResolveMarket, 
    data, 
    isPending, 
    isError, 
    error 
  };
};