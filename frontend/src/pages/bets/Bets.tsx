import { DashboardLayout } from "@/components/DashboardLayout";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetAllMarkets } from "@/program-hooks/get-market";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { BetCard } from "./components/BetCard";
import { useGetUserBets } from "@/program-hooks/get-bets";

const Bets = () => {
  const { bets, isPending: betsLoading } = useGetUserBets();
  const { markets, isLoading: marketsLoading } = useGetAllMarkets();

  // Create a map of market public keys to market data
  const marketMap = useMemo(() => {
    const map = new Map();
    markets.forEach((market) => {
      map.set(market.publicKey, market);
    });
    return map;
  }, [markets]);
  // Process bets with market data
  const processedBets = useMemo(() => {
    return bets.map((bet) => {
      const marketPubKey = bet.account.market.toString();
      const market = marketMap.get(marketPubKey);

      // Convert BN values to numbers
      const amount = typeof bet.account.amount === 'object' && 'toNumber' in bet.account.amount
        ? bet.account.amount.toNumber()/1000000
        : 0;

      const payoutAmount = bet.account.payoutAmount && 
        typeof bet.account.payoutAmount === 'object' && 
        'toNumber' in bet.account.payoutAmount
        ? bet.account.payoutAmount.toNumber()/1000000
        : 0;

      const timestamp = typeof bet.account.timestamp === 'object' && 'toNumber' in bet.account.timestamp
        ? bet.account.timestamp.toNumber()
        : 0;

      return {
        publicKey: bet.publicKey,
        amount,
        payoutAmount,
        timestamp,
        teamIndex: bet.account.teamIndex,
        marketPublicKey: marketPubKey,
        market: market ? {
          publicKey: market.publicKey,
          account: {
            leagueName: market.account.leagueName,
            season: market.account.season,
            teams: market.account.teams,
            isResolved: market.account.isResolved,
            winningTeamIndex: market.account.winningTeamIndex,
          }
        } : null,
      };
    });
  }, [bets, marketMap]);

  if (betsLoading || marketsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your bets...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bets</h1>
          <p className="text-muted-foreground">
            Track all your league championship predictions
          </p>
        </div>

        {processedBets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No bets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedBets.map((bet) => (
              <BetCard key={bet.publicKey} {...bet} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bets;