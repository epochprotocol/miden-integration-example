import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MidenAssetOption } from "../../../types/miden";

interface Props {
  assets: MidenAssetOption[];
  selectedAssetId: string;
  selectedAsset?: MidenAssetOption;
  isLoadingAssets: boolean;
  onSelect: (assetId: string) => void;
}

export function IntentSourceAssetField({
  assets,
  selectedAssetId,
  selectedAsset,
  isLoadingAssets,
  onSelect,
}: Props) {
  return (
    <div className="space-y-2">
      <Label>Source asset</Label>
      <SelectRoot value={selectedAssetId || undefined} onValueChange={onSelect}>
        <SelectTrigger aria-label="Select Miden asset">
          <SelectValue
            placeholder={isLoadingAssets ? "Loading assets…" : "Select asset"}
          />
        </SelectTrigger>
        <SelectContent>
          {assets.map((a) => (
            <SelectItem key={a.assetId} value={a.assetId}>
              {a.symbol ?? a.assetId.slice(0, 16) + "…"} — {a.amount.toString()}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      <p className="text-xs text-neutral-500">
        Balance:{" "}
        <span className="font-mono">
          {selectedAsset?.amount?.toString() ?? "—"}
        </span>
      </p>
      {!isLoadingAssets && assets.length === 0 && (
        <p className="text-xs text-amber-800">
          No Miden assets found in this wallet. Fund it before bridging.
        </p>
      )}
    </div>
  );
}
