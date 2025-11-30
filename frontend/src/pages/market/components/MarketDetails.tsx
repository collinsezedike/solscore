import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMarket } from "@/program-hooks/get-market";
import { 
  ArrowLeft, 
  TrendingUp, 
  Coins,
  Trophy,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { usePlaceBet } from "@/program-hooks/Place-bet";

export default function MarketDetails() {
  const { marketId } = useParams<{ marketId: string }>();
  const navigate = useNavigate();
    const { market, isLoading, isError } = useGetMarket(marketId);
    const {placeBet, isPending}= usePlaceBet()
  
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading market details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !market) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-xl text-muted-foreground">Market not found</p>
            <Button onClick={() => navigate("/markets")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Markets
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { account } = market;
  

  const handlePlaceBet = () => {
    if (selectedTeam === null) {
      toast.error("Please select a team");
      return;
    }
    
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

   const stakeAmountFloat = parseFloat(stakeAmount);
  // Divide maxStakeAmount since it's now stored in smallest units
  const maxStake = parseFloat(market.account.maxStakeAmount.toString()) / 1_000_000;

  if (stakeAmountFloat > maxStake) {
    toast.error(`Maximum stake is ${maxStake} USDC`);
    return;
    }
    
if (!market || !marketId) {
    toast.error("Market not found");
    return;
  }
    // Convert to smallest units before sending
  const amountInSmallestUnit = Math.floor(stakeAmountFloat * 1_000_000);
  
  placeBet({
    marketPublicKey: marketId,
    teamIndex: selectedTeam,
    amount: amountInSmallestUnit,
  });
  };

  const selectedOdd = selectedTeam !== null ? (() => {
    const oddValue = account.odds[selectedTeam];
    return typeof oddValue === 'object' && 'toNumber' in oddValue
      ? oddValue.toNumber()
      : Number(oddValue);
  })() : 0;

  const potentialWin = stakeAmount && selectedTeam !== null
    ? (parseFloat(stakeAmount) * selectedOdd).toFixed(2)
    : "0.00";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/markets")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{account.leagueName}</h1>
            <p className="text-muted-foreground">{account.season}</p>
          </div>
          <Badge 
            variant={account.isResolved ? "destructive" : "secondary"}
            className="text-sm px-4 py-2"
          >
            {account.isResolved ? "Resolved" : "Active"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info & Teams */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Stats */}
            <Card className="bg-gradient-dark border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Stake</p>
                  <p className="text-2xl font-bold text-primary">
                   {(market.account.maxStakeAmount / 1_000_000).toString()} USDC
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Bettors</p>
                  <p className="text-2xl font-bold">{market.account.allowedBettors.toString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-2xl font-bold">{account.teams.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Teams Grid */}
            <Card className="bg-gradient-dark border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Championship Contenders
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a team to place your bet
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {account.teams.map((team, index) => {
                    const oddValue = account.odds[index];
                    const oddNum = typeof oddValue === 'object' && 'toNumber' in oddValue
                      ? oddValue.toString()
                      : Number(oddValue);
                    
                    const isSelected = selectedTeam === index;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !account.isResolved && setSelectedTeam(index)}
                        disabled={account.isResolved}
                        className={`
                          p-4 rounded-lg border-2 transition-all text-left
                          ${isSelected 
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                            : 'border-border/50 bg-background/50 hover:border-primary/50 hover:bg-background/80'
                          }
                          ${account.isResolved && 'opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                              ${isSelected ? 'bg-primary text-black' : 'bg-muted text-muted-foreground'}
                            `}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-base">{team}</p>
                              <p className="text-xs text-muted-foreground">
                                {isSelected ? "Selected" : "Click to select"}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-lg px-3 py-1 ${isSelected ? 'border-primary bg-primary/20' : ''}`}
                          >
                            {oddNum.toString()}x
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Place Bet */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-dark border-border/50 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Place Your Bet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {account.isResolved && (
                  <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-destructive">
                      This market has been resolved
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Selected Team</Label>
                  <div className="p-3 bg-muted rounded-lg min-h-[48px] flex items-center">
                    <p className="font-medium">
                      {selectedTeam !== null 
                        ? account.teams[selectedTeam]
                        : "No team selected"
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stake">Stake Amount (USDC)</Label>
                  <Input
                    id="stake"
                    type="number"
                    step="0.01"
                    min="0"
                    max={(market.account.maxStakeAmount / 1_000_000).toString()}
                    placeholder="0.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    disabled={account.isResolved}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {(market.account.maxStakeAmount / 1_000_000).toFixed(2)} USDC
                  </p>
                </div>

                {selectedTeam !== null && stakeAmount && (
                  <div className="p-4 bg-primary/10 border border-primary/50 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your Stake</span>
                      <span className="font-semibold">{parseFloat(stakeAmount).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Odds</span>
                      <span className="font-semibold">{selectedOdd.toFixed(1)}x</span>
                    </div>
                    <div className="border-t border-primary/30 pt-3 flex justify-between items-center">
                      <span className="font-semibold text-sm">Potential Win</span>
                      <span className="font-bold text-primary text-xl">
                        {potentialWin} USDC
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full gradient-orange hover:opacity-90 text-base py-6"
                  onClick={handlePlaceBet}
                  disabled={account.isResolved || selectedTeam === null || !stakeAmount || isPending}
                >
                  {isPending ? "Please Wait" : "Place Bet"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Demo mode - No actual transaction will be made
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}