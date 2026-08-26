import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MidenNoteVisibility } from "@epoch-protocol/epoch-intents-sdk";

interface Props {
  value: MidenNoteVisibility;
  onSelect: (value: MidenNoteVisibility) => void;
  /** Allocator advertises `midenPrivateNotesSupported` — see useMidenPrivateNotesSupport. */
  isPrivateSupported: boolean;
  isLoadingSupport: boolean;
}

export function IntentNoteVisibilityField({
  value,
  onSelect,
  isPrivateSupported,
  isLoadingSupport,
}: Props) {
  return (
    <div className="space-y-2">
      <Label>Collateral note visibility</Label>
      <SelectRoot
        value={value}
        onValueChange={(v) => onSelect(v as MidenNoteVisibility)}
      >
        <SelectTrigger aria-label="Select collateral note visibility">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">Public — full note on Miden</SelectItem>
          <SelectItem value="private" disabled={!isPrivateSupported}>
            Private — only the commitment on Miden
            {isPrivateSupported ? "" : " (allocator unsupported)"}
          </SelectItem>
        </SelectContent>
      </SelectRoot>
      <p className="text-xs text-neutral-500">
        {value === "private" ? (
          <>
            Your Miden account, the faucet and the amount stay off-chain. The
            note body is sent to the allocator with the intent — it is the only
            copy, so a failed submission strands the collateral.
          </>
        ) : (
          <>
            The note&apos;s target account, faucet and amount are published to
            Miden&apos;s note database and readable by anyone.
            {isLoadingSupport
              ? " Checking whether the allocator supports private notes…"
              : isPrivateSupported
                ? ""
                : " This allocator cannot accept private notes yet."}
          </>
        )}
      </p>
    </div>
  );
}
