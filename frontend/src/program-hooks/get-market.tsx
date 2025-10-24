import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import idl from "@/idl/idl.json";
import { PublicKey } from "@solana/web3.js";
import { Solscore } from "@/idlTypes/idlType";

interface Market {
  publicKey: string;
  account: {
    admin: PublicKey;
    leagueName: string;
    season: string;
    teams: string[];
    odds: (number | BN)[];
    maxStakeAmount: number;
    allowedBettors: number;
    vault: PublicKey;
      mint: PublicKey;
    isResolved:boolean
  };
}

//Another method of getting markets kinda harder than the other one
// export const useGetMarket = (leagueName?: string, season?: string) => {
//   const { publicKey } = useWallet();
//   const { connection } = useConnection();
//   const wallet = useAnchorWallet();

//   const getMarket = async (): Promise<Market | null> => {
//     if (!wallet || !leagueName || !season) return null;

//     try {
//       const programId = new PublicKey(PROGRAM_ID);
//       const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
//       const program = new Program<Solscore>(idl as Solscore, provider);

//       // Derive the market PDA
//       const [marketPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("market"), Buffer.from(leagueName), Buffer.from(season)],
//         programId
//       );

//       // Fetch the market account
//       const marketAccount = await program.account.market.fetch(marketPDA);

//       return {
//         publicKey: marketPDA.toBase58(),
//         account: marketAccount as any,
//       };
//     } catch (error) {
//       console.error("Error fetching market:", error);
//       throw error;
//     }
//   };

//   const { data, isLoading, isError, error, refetch } = useQuery({
//     queryKey: ["market", leagueName, season, publicKey?.toBase58()],
//     queryFn: getMarket,
//     enabled: !!wallet && !!leagueName && !!season,
//     refetchOnWindowFocus: false,
//     retry: 1,
//   });

//   return {
//     market: data,
//     isLoading,
//     isError,
//     error,
//     refetch,
//   };
// };


// Hook to get a single market by public key (for market details page)
export const useGetMarket = (marketPublicKey?: string) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getMarket = async (): Promise<Market | null> => {
    if (!wallet || !marketPublicKey) return null;

    try {
      // const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);

      const marketPDA = new PublicKey(marketPublicKey);

      // Fetch the market account directly by public key
      const marketAccount = await program.account.market.fetch(marketPDA);

      return {
        publicKey: marketPDA.toBase58(),
        account: marketAccount as any,
      };
    } catch (error) {
      console.error("Error fetching market:", error);
      throw error;
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["market", marketPublicKey],
    queryFn: getMarket,
    enabled: !!wallet && !!marketPublicKey,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    market: data,
    isLoading,
    isError,
    error,
    refetch,
  };
};


// Hook to get all markets
export const useGetAllMarkets = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getAllMarkets = async (): Promise<Market[]> => {
    if (!wallet) return [];

    try {
      // const programId = new PublicKey(PROGRAM_ID);
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new Program<Solscore>(idl as Solscore, provider);

      // Fetch all market accounts
      const markets = await program.account.market.all();
      return markets.map((market) => ({
        publicKey: market.publicKey.toBase58(),
        account: market.account as any,
      }));
    } catch (error) {
      console.error("Error fetching all markets:", error);
      throw error;
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["markets", "all"],
    queryFn: getAllMarkets,
    enabled: !!wallet,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  return {
    markets: data || [],
    isLoading,
    isError,
    error,
    refetch,
  };
};