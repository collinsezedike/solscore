import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClaimPayout } from "@/program-hooks/claim-payout";

interface BetCardProps {
  amount: number;
  payoutAmount: number;
  timestamp: number;
  teamIndex: number;
  marketPublicKey: string;
  market: {
    publicKey: string;
    account: {
      leagueName: string;
      season: string;
      teams: string[];
      isResolved: boolean;
      winningTeamIndex: number | null;
    };
  } | null;
}

export function BetCard({
  amount,
  payoutAmount,
  timestamp,
  teamIndex,
  marketPublicKey,
  market,
}: BetCardProps) {
  const { claimPayout, isPending } = useClaimPayout();

  // Format timestamp
  const formatDate = (ts: number) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const leagueName = market?.account.leagueName || 'Unknown League';
  const season = market?.account.season || 'Unknown Season';
  const teamName = market?.account.teams[teamIndex] || `Team #${teamIndex}`;
  
  // Determine bet status
  const isResolved = market?.account.isResolved || false;
  const winningTeamIndex = market?.account.winningTeamIndex;
  
  let status: 'pending' | 'won' | 'lost' = 'pending';
  if (isResolved && winningTeamIndex !== null && winningTeamIndex !== undefined) {
    status = winningTeamIndex === teamIndex ? 'won' : 'lost';
  }

  const handleClaim = async () => {
    if (!market) return;
    
    try {
      await claimPayout({
        marketPublicKey,
        leagueName: market.account.leagueName,
        season: market.account.season,
      });
    } catch (error) {
      console.error("Error claiming payout:", error);
    }
  };

  const statusConfig = {
    pending: { 
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50', 
      label: 'Pending',
      icon: null
    },
    won: { 
      color: 'bg-green-500/10 text-green-500 border-green-500/50', 
      label: 'Won',
      icon: Trophy
    },
    lost: { 
      color: 'bg-red-500/10 text-red-500 border-red-500/50', 
      label: 'Lost',
      icon: X
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // console.log(amount)
  return (
    <Card className="bg-gradient-dark border-border/50 hover:border-primary/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={config.color} variant="outline">
            {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
            {config.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(timestamp)}
          </div>
        </div>
        <CardTitle className="text-lg">{leagueName}</CardTitle>
        <p className="text-sm text-muted-foreground">{season}</p>
        <p>Who wins the League?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Your Prediction</p>
          <p className="font-semibold text-lg">{teamName}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stake Amount</span>
            <span className="font-semibold">{amount.toFixed(2)}USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Potential Win</span>
            <span className="font-semibold text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {payoutAmount.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {status === 'won' && (
          <div className="space-y-2">
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-center">
              <p className="text-green-500 font-semibold text-sm mb-1">
                Congratulations! 🎉
              </p>
              <p className="text-green-500 font-bold text-lg">
                +{payoutAmount.toFixed(2)} USDC
              </p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={isPending}
              className="w-full gradient-orange"
            >
              {isPending ? "Claiming..." : "Claim Payout"}
            </Button>
          </div>
        )}

        {status === 'lost' && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center">
            <p className="text-red-500 font-semibold">
              -{amount.toFixed(2)} USDC
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};