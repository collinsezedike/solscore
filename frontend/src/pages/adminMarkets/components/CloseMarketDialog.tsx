import { useState } from 'react';
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

import { Loader2, Trophy } from "lucide-react";
import { useCloseMarket } from '@/program-hooks/close-market';

interface CloseMarketDialogProps {
  marketPublicKey: string;
  leagueName: string;
  season: string;
  isResolved: boolean;
}

const CloseMarketDialog = ({
  marketPublicKey,
  leagueName,
  season,
  // isResolved
}: CloseMarketDialogProps) => {
  const [open, setOpen] = useState(false);
    const { closeMarket, isPending } = useCloseMarket();

  const handleCloseMarket = () => {
       closeMarket({
        marketPublicKey,
        leagueName,
        season,
      });
  };

//   if (isResolved) {
//     return null; // Don't show button if already resolved
//   }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Trophy className="mr-2 h-4 w-4" />
          Close Market
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Close Market</DialogTitle>
            <DialogDescription>
              Close Market for {leagueName} {season}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
         
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleCloseMarket}
              disabled={isPending}
              className="gradient-orange"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing...
                </>
              ) : (
                "Close Market"
              )}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseMarketDialog;