import { useState } from 'react';
import { clearPersistedData } from '../../utils/persistence';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PersistenceControls() {
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearPersistedData();
      window.location.reload();
    } catch {
      setIsClearing(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="ui-card-muted flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Persistence</h3>
          <p className="mt-1 text-xs text-neutral-600">Accounts and faucets are saved to browser storage</p>
        </div>
        <Button type="button" variant="destructive" className="shrink-0" onClick={() => setOpen(true)}>
          Clear saved data
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={!isClearing}
          onPointerDownOutside={(e) => isClearing && e.preventDefault()}
          onEscapeKeyDown={(e) => isClearing && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Clear all saved data?</DialogTitle>
            <DialogDescription>
              This removes stored Miden wallets and faucet metadata from this browser. The page will reload. On-chain
              accounts are unchanged; you would need seed or recovery to access them again from another device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={isClearing} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isClearing} onClick={handleConfirmClear}>
              {isClearing ? 'Clearing…' : 'Clear and reload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
