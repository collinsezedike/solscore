import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey } from "@solana/web3.js";
import { Solscore } from "@/idlTypes/idlType";

const PROGRAM_ID = "4g9MJ1aapgPqZXzX1gSdURyYw5prhpRkff6KJ4mfBdnK";

interface Bet {
  publicKey: string;
  account: {
    user: string;
    market: string;
    teamIndex: number;
    amount: BN;
    payoutAmount: BN | null;
    timestamp: BN;
  };
}

// Hook to get all bets for the current user
export const useGetUserBets = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getUserBets = async (): Promise<Bet[]> => {
    if (!wallet || !publicKey) return [];

    try {
      const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);

      // Fetch all bet accounts for the current user
      const bets = await program.account.bet.all([
        {
          memcmp: {
            offset: 8, // Skip the 8-byte discriminator
            bytes: publicKey.toBase58(),
          },
        },
      ]);

        console.log(bets)
      return bets.map((bet) => ({
        publicKey: bet.publicKey.toBase58(),
        account: bet.account as any,
      }));
    } catch (error) {
      console.error("Error fetching user bets:", error);
      throw error;
    }
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["userBets", publicKey?.toBase58()],
    queryFn: getUserBets,
    enabled: !!wallet && !!publicKey,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  return {
    bets: data || [],
    isPending,
    isError,
    error,
    refetch,
  };
};

// Hook to get a specific bet by user and market
export const useGetBet = (marketPublicKey?: string) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getBet = async (): Promise<Bet | null> => {
    if (!wallet || !publicKey || !marketPublicKey) return null;

    try {
      const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);

      const marketPDA = new PublicKey(marketPublicKey);

      // Derive the bet PDA
      const [betPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), publicKey.toBuffer(), marketPDA.toBuffer()],
        programId
      );

      // Try to fetch the bet account
      try {
        const betAccount = await program.account.bet.fetch(betPDA);
        return {
          publicKey: betPDA.toBase58(),
          account: betAccount as any,
        };
      } catch (error) {
        // Bet doesn't exist for this user/market combination
        return null;
      }
    } catch (error) {
      console.error("Error fetching bet:", error);
      throw error;
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bet", publicKey?.toBase58(), marketPublicKey],
    queryFn: getBet,
    enabled: !!wallet && !!publicKey && !!marketPublicKey,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    bet: data,
    isLoading,
    isError,
    error,
    refetch,
  };
};

// Hook to get all bets for a specific market
export const useGetMarketBets = (marketPublicKey?: string) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getMarketBets = async (): Promise<Bet[]> => {
    if (!wallet || !marketPublicKey) return [];

    try {
      const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);

      const marketPDA = new PublicKey(marketPublicKey);

      // Fetch all bets for this market
      const bets = await program.account.bet.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator (8) + user pubkey (32)
            bytes: marketPDA.toBase58(),
          },
        },
      ]);

      return bets.map((bet) => ({
        publicKey: bet.publicKey.toBase58(),
        account: bet.account as any,
      }));
    } catch (error) {
      console.error("Error fetching market bets:", error);
      throw error;
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["marketBets", marketPublicKey],
    queryFn: getMarketBets,
    enabled: !!wallet && !!marketPublicKey,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  return {
    bets: data || [],
    isLoading,
    isError,
    error,
    refetch,
  };
};