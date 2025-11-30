import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { PublicKey } from "@solana/web3.js";
import AdminMarketDialog from "./AdminMarketDialog";
import CloseMarketDialog from "./CloseMarketDialog";

interface MarketCardProps {
  publicKey: string;
  account: {
    admin: PublicKey;
    leagueName: string;
    season: string;
    teams: string[];
    odds: number[];
    maxStakeAmount: number;
    allowedBettors: number;
    vault: PublicKey;
    mint: PublicKey;
    isResolved: boolean;
  };
}

export function AdminMarketCard({ publicKey, account }: MarketCardProps) {
  const navigate = useNavigate();
  
  const {
    leagueName,
    season,
    teams,
    maxStakeAmount,
    allowedBettors,
    isResolved
  } = account;

  // Create market title from league and season
  const marketTitle = `${leagueName} - ${season}`;

  // Format teams display
  const teamsDisplay = teams.length > 2 
    ? `${teams.slice(0, 2).join(" vs ")} +${teams.length - 2} more`
    : teams.join(" vs ");

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:glow-orange cursor-pointer bg-gradient-dark">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge 
            variant={!isResolved ? "secondary" : "destructive"} 
            className="text-xs"
          >
            {!isResolved ? "Open" : "Resolved"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {season}
          </div>
        </div>
        <CardTitle className="text-lg">{marketTitle}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{teamsDisplay}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Max Stake:</span>
            <span className="font-semibold">{maxStakeAmount.toString()} USDC</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Max: {allowedBettors.toString()}
            </span>
          </div>
        </div>

        {/* Display teams with odds */}
        <div className="space-y-2">
          {teams.slice(0, 3).map((team, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between text-xs p-2 rounded bg-background/50"
            >
              <span className="truncate">{team}</span>
              <Badge variant="outline" className="ml-2">
                {account.odds[index] ? `${account.odds[index]}x` : "N/A"}
              </Badge>
            </div>
          ))}
          {teams.length > 3 && (
            <p className="text-xs text-center text-muted-foreground">
              +{teams.length - 3} more teams
            </p>
          )}
        </div>

        <Button
          className="w-full gradient-orange hover:opacity-90 transition-opacity"
          onClick={() => navigate(`/markets/${publicKey}`)}
        >
          View Market Details
        </Button>

        <AdminMarketDialog 
          marketPublicKey={publicKey}
          leagueName={leagueName}
          season={season}
          teams={teams}
          isResolved={isResolved}
        />

        <CloseMarketDialog marketPublicKey={publicKey}
          leagueName={leagueName}
          season={season}
          isResolved={isResolved} />
        
      </CardContent>
    </Card>
  );
};