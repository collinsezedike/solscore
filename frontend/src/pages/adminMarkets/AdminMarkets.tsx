import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllMarkets } from "@/program-hooks/get-market";
import { AdminMarketCard } from "./components/AdminMarketCard";

const AdminMarkets = () => {
  const { markets } = useGetAllMarkets();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");

  const filteredMarkets = markets.filter((market) => {
    const matchesSearch = market.account.leagueName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === "all" || market.account.leagueName === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const leagues = ["all", ...Array.from(new Set(markets.map((m) => m.account.leagueName)))];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Markets</h1>
          <p className="text-muted-foreground">
            Browse all available prediction markets
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              className="pl-10 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-full md:w-[200px] bg-card border-border">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by league" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {leagues.map((league) => (
                <SelectItem key={league} value={league}>
                  {league === "all" ? "All Leagues" : league}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <AdminMarketCard
              key={market.publicKey}
              publicKey={market.publicKey}
              account={market.account}
            />
          ))}
        </div>

        {filteredMarkets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No markets found matching your criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminMarkets;
