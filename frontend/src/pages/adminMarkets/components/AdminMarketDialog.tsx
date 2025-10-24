import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResolveMarket } from "@/program-hooks/resolve-market";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface AdminMarketDialogProps {
  marketPublicKey: string;
  leagueName: string;
  season: string;
  teams: string[];
  isResolved: boolean;
}

const AdminMarketDialog = ({
  marketPublicKey,
  leagueName,
  season,
  teams,
  isResolved
}: AdminMarketDialogProps) => {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<string>("");
  const [open, setOpen] = useState(false);
  const { resolveMarket, isPending } = useResolveMarket();

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeamIndex) {
      toast.error("Please select a winning team");
      return;
    }

    try {
      await resolveMarket({
        marketPublicKey,
        winningTeamIndex: parseInt(selectedTeamIndex),
      });

      // Close dialog on success
      setOpen(false);
      setSelectedTeamIndex("");
    } catch (error) {
      console.error("Error resolving market:", error);
    }
  };

  if (isResolved) {
    return null; // Don't show button if already resolved
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Trophy className="mr-2 h-4 w-4" />
          Resolve Market
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleResolve}>
          <DialogHeader>
            <DialogTitle>Resolve Market</DialogTitle>
            <DialogDescription>
              Select the winning team for {leagueName} {season}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="winning-team">Winning Team</Label>
              <Select
                value={selectedTeamIndex}
                onValueChange={setSelectedTeamIndex}
                disabled={isPending}
              >
                <SelectTrigger id="winning-team">
                  <SelectValue placeholder="Select winning team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTeamIndex && (
              <div className="p-3 bg-primary/10 border border-primary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">You are declaring:</p>
                <p className="font-semibold text-lg">
                  {teams[parseInt(selectedTeamIndex)]} as the winner
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending || !selectedTeamIndex}
              className="gradient-orange"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                "Resolve Market"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMarketDialog;