import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  connectedAddress?: string;
  midenRecipientId: string;
  midenFaucetId: string;
  onMidenRecipientIdChange: (value: string) => void;
  onMidenFaucetIdChange: (value: string) => void;
}

export function WithdrawAccountFields({
  connectedAddress,
  midenRecipientId,
  midenFaucetId,
  onMidenRecipientIdChange,
  onMidenFaucetIdChange,
}: Props) {
  return (
    <>
      <div>
        <Label>EVM source wallet</Label>
        <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[13px] text-neutral-600 break-all">
          {connectedAddress ?? (
            <span className="text-amber-700">Connect EVM wallet above</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wd-recipient">Destination (Miden wallet)</Label>
          <Input
            id="wd-recipient"
            type="text"
            value={midenRecipientId}
            onChange={(e) => onMidenRecipientIdChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="wd-faucet-id">Miden faucet ID</Label>
          <Input
            id="wd-faucet-id"
            value={midenFaucetId}
            onChange={(e) => onMidenFaucetIdChange(e.target.value)}
            placeholder="Paste faucet account ID"
            className="font-mono text-[13px]"
          />
        </div>
      </div>
    </>
  );
}
