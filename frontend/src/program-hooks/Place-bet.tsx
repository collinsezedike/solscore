import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useMutation } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";
// import { Solscore } from "@/idlTypes/idlType";
import { toast } from "sonner";

const mintAddress = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const PROGRAM_ID = "4g9MJ1aapgPqZXzX1gSdURyYw5prhpRkff6KJ4mfBdnK";

interface PlaceBetParams {
  marketPublicKey: string;
  teamIndex: number;
  amount: number; 
}

export const usePlaceBet = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const placeBet = async ({
    marketPublicKey,
    teamIndex,
    amount,
  }: PlaceBetParams) => {
    if (!wallet || !publicKey) throw new Error("Wallet not connected!");
    if (!marketPublicKey || teamIndex === undefined || !amount) {
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

      // console.log("Bet PDA:", betPDA.toBase58());
      // console.log("Market PDA:", marketPDA.toBase58());
      // console.log("Vault:", vault.toBase58());
      // console.log("User Token Account:", userTokenAccount.toBase58());

      // Convert amount from SOL to lamports (assuming 6 decimals for SPL token)
    //   const amountInLamports = new BN(amount * 1_000_000);
    //   const teamIndexBN = teamIndex; // Keep as number, Anchor will convert

        // console.log(amount);
        // console.log(teamIndex)

      const tx = await program.methods
        .placeBet(new BN(teamIndex), new BN(amount))
        .accounts({
          bet: betPDA,
          market: marketPDA,
          vault,
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

      console.log("Bet placed successfully:", tx);
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
    console.error("Booking bet failed:", err);
    throw error; 
}
  };

  const { mutateAsync: executePlaceBet, data, isPending, isError, error } = useMutation({
    mutationFn: placeBet,
    onSuccess: (data: any) => {
      toast.success("Bet placed successfully!", {
        description: `Transaction confirmed`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${data}?cluster=devnet`, "_blank"),
        },
      });
    },
    onError: (error: any) => {
      console.error("Bet placement failed:", error.message);
      toast.error(`Failed to place bet: ${error.message}`);
    },
  });

  return { 
    placeBet: executePlaceBet, 
    data, 
    isPending, 
    isError, 
    error 
  };
};