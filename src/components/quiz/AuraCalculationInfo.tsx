
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export const AuraCalculationInfo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How Aura Points are Calculated</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div>
              <h3 className="font-semibold">For Multiple Choice Questions:</h3>
              <ul className="list-disc pl-6 pt-2 space-y-1">
                <li>1st choice (most like you) = 4 points</li>
                <li>2nd choice = 3 points</li>
                <li>3rd choice = 2 points</li>
                <li>4th choice (least like you) = 1 point</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">For Number Input Questions:</h3>
              <ul className="list-disc pl-6 pt-2 space-y-1">
                <li>1-25 = 1 point</li>
                <li>26-50 = 2 points</li>
                <li>51-75 = 3 points</li>
                <li>76-100 = 4 points</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
