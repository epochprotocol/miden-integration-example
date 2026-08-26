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
}

/**
 * Visibility of the Miden note the user RECEIVES.
 *
 * Distinct from the deposit-side selector: there the user mints their own
 * collateral note, here the allocator mints the payout. The choice is signed
 * into the mandate, so no service in the path can quietly downgrade it.
 *
 * No allocator capability check — unlike the collateral direction, the
 * allocator is the one minting, and it always supports both.
 */
export function WithdrawNoteVisibilityField({ value, onSelect }: Props) {
  const isPrivate = value === "private";
  return (
    <div className="space-y-2">
      <Label>Payout note visibility</Label>
      <SelectRoot
        value={value}
        onValueChange={(v) => onSelect(v as MidenNoteVisibility)}
      >
        <SelectTrigger aria-label="Select payout note visibility">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">
            Public — visible on the Miden chain
          </SelectItem>
          <SelectItem value="private">
            Private — only a commitment is published
          </SelectItem>
        </SelectContent>
      </SelectRoot>

      {isPrivate ? (
        // Deliberately blunt. The note body is the only way to claim a private
        // payout: until it is imported, the funds exist only in our database.
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <strong>Save the note file after settlement.</strong> A private note
          publishes only a commitment, so the file is the only way to claim it.
          The note stays yours indefinitely, and you can fetch the file again
          any time with <strong>Recover my notes</strong>. This hides the payout
          from other chain observers — not from Epoch, which mints it.
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          The note is readable on-chain, so it can always be found and claimed.
        </p>
      )}
    </div>
  );
}
