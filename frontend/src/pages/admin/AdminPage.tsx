import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Shield, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInitializeMarket } from "@/program-hooks/initialize-market";
import { useNavigate } from "react-router";

interface TeamOdds {
  id: string;
  teamName: string;
  odds: string;
}

export default function Admin() {
    const navigate = useNavigate();
  
  const { createMarket, isPending, data } = useInitializeMarket();
  const [leagueName, setLeagueName] = useState("");
  const [season, setSeason] = useState("");
  const [maxStake, setmaxStakeAmount] = useState("");
  const [allowedBettors, setAllowedBettors] = useState("");
  const [teamsOdds, setTeamsOdds] = useState<TeamOdds[]>([
    { id: "1", teamName: "", odds: "" },
    { id: "2", teamName: "", odds: "" },
  ]);

  const addTeamOdds = () => {
    setTeamsOdds([
      ...teamsOdds,
      { id: Date.now().toString(), teamName: "", odds: "" },
    ]);
  };

  const removeTeamOdds = (id: string) => {
    if (teamsOdds.length > 2) {
      setTeamsOdds(teamsOdds.filter((item) => item.id !== id));
    } else {
      toast.error("Minimum 2 teams required");
    }
  };

  const updateTeamOdds = (id: string, field: "teamName" | "odds", value: string) => {
    setTeamsOdds(
      teamsOdds.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateRequiredFunds = () => {
    if (!maxStake || !allowedBettors || teamsOdds.length === 0) return 0;
    
    const maxStakeAmount = parseFloat(maxStake);
    const bettors = parseFloat(allowedBettors);
    const odds = teamsOdds.map((t) => parseFloat(t.odds) || 0);
    const highestOdd = Math.max(...odds);
    
    return maxStakeAmount * highestOdd * bettors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!leagueName || !season || !maxStake || !allowedBettors) {
      toast.error("Please fill in all fields");
      return;
    }

    const emptyTeams = teamsOdds.some((t) => !t.teamName || !t.odds);
    if (emptyTeams) {
      toast.error("Please fill in all team names and odds");
      return;
    }

    const teams = teamsOdds.map((t) => t.teamName);
    const odds = teamsOdds.map((t) => parseFloat(t.odds));

    if (teams.length !== odds.length) {
      toast.error("Teams and odds length mismatch");
      return;
    }

    const requiredFunds = calculateRequiredFunds();

    console.log({
      leagueName,
      season,
      teams,
      odds,
      maxStake,
      allowedBettors,
      requiredFunds,
    });


    createMarket(
      {leagueName,
      season,
      teams,
      odds,
      maxStakeAmount:parseFloat(maxStake),
      allowedBettors:parseFloat(allowedBettors),
    });

    // Reset form
    setLeagueName("");
    setSeason("");
    setmaxStakeAmount("");
    setAllowedBettors("");
    setTeamsOdds([
      { id: "1", teamName: "", odds: "" },
      { id: "2", teamName: "", odds: "" },
    ]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-orange">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage prediction markets
            </p>
          </div>
        </div>
        

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Create New Market</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Initialize a new prediction market for a football league
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* League Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leagueName">League Name</Label>
                  <Input
                    id="leagueName"
                    placeholder="e.g., Premier League"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    placeholder="e.g., 2024/25"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Market Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStakeAmount">Max Stake Amount (USDC)</Label>
                  <Input
                    id="maxStakeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 10"
                    value={maxStake}
                    onChange={(e) => setmaxStakeAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowedBettors">Allowed Bettors</Label>
                  <Input
                    id="allowedBettors"
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={allowedBettors}
                    onChange={(e) => setAllowedBettors(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Teams and Odds */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Teams & Odds</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTeamOdds}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Team</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {teamsOdds.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`team-${item.id}`} className="text-xs sm:text-sm">
                          Team {index + 1}
                        </Label>
                        <Input
                          id={`team-${item.id}`}
                          placeholder="Team name"
                          value={item.teamName}
                          onChange={(e) =>
                            updateTeamOdds(item.id, "teamName", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="w-full sm:w-32 space-y-2">
                        <Label htmlFor={`odds-${item.id}`} className="text-xs sm:text-sm">
                          Odds
                        </Label>
                        <Input
                          id={`odds-${item.id}`}
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="e.g., 2.5"
                          value={item.odds}
                          onChange={(e) =>
                            updateTeamOdds(item.id, "odds", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamOdds(item.id)}
                          disabled={teamsOdds.length <= 2}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Funding Display */}
              {calculateRequiredFunds() > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Required Vault Funding
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Max Stake × Highest Odds × Allowed Bettors)
                      </p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {calculateRequiredFunds().toFixed(2)} USDC
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
             

                  {isPending ?
             <Button
                type="submit"
                  size="lg"
                  disabled
                className="w-full bg-gradient-to-r from-primary  hover:opacity-90 transition-opacity text-base sm:text-lg h-12 sm:h-14"
              >
                    <Loader2Icon className="animate-spin" />
                Creating Market
              </Button>    :
            <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r bg-orange-600 hover:opacity-90 transition-opacity text-base sm:text-lg h-12 sm:h-14"
              >
                Create Market
              </Button>
          }
            </form>
            <Button
               onClick={() => navigate(`/admin/markets/`)}
                size="lg"
                className="mt-6 w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-base sm:text-lg h-12 sm:h-14"
              >
                View My Markets
              </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
