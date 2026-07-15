import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTestnetChainName } from "../../../constants/chains";
import { TOKEN_CUSTOM, WITHDRAW_TOKENS } from "./withdraw-tokens";

interface Props {
  walletChainId: number;
  /** "" means the Custom row is selected. */
  evmToken: string;
  customToken: string;
  minTokenOut: string;
  onEvmTokenChange: (address: string) => void;
  onCustomTokenChange: (address: string) => void;
  onMinTokenOutChange: (value: string) => void;
}

export function WithdrawTokenFields({
  walletChainId,
  evmToken,
  customToken,
  minTokenOut,
  onEvmTokenChange,
  onCustomTokenChange,
  onMinTokenOutChange,
}: Props) {
  const isCustom = evmToken === "";

  return (
    <>
      <div>
        <Label>Source EVM token ({getTestnetChainName(walletChainId)})</Label>
        <SelectRoot
          value={isCustom ? TOKEN_CUSTOM : evmToken}
          onValueChange={(v) => onEvmTokenChange(v === TOKEN_CUSTOM ? "" : v)}
        >
          <SelectTrigger aria-label="Select EVM token">
            <SelectValue placeholder="Token" />
          </SelectTrigger>
          <SelectContent>
            {WITHDRAW_TOKENS.map((token) => (
              <SelectItem
                key={token.symbol}
                value={token.address === "" ? TOKEN_CUSTOM : token.address}
              >
                {token.symbol}
                {token.address ? ` · ${token.address.slice(0, 10)}…` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>

      {isCustom && (
        <div>
          <Label htmlFor="wd-custom">Custom token address</Label>
          <Input
            id="wd-custom"
            value={customToken}
            onChange={(e) => onCustomTokenChange(e.target.value)}
            placeholder="0x…"
            className="font-mono text-[13px]"
          />
        </div>
      )}

      <div>
        <Label htmlFor="wd-min-token-out">
          Min Miden tokens to receive{" "}
          <span className="text-xs font-normal text-neutral-500">
            (base units — maps directly to intent{" "}
            <code className="text-[11px]">minTokenOut</code>)
          </span>
        </Label>
        <Input
          id="wd-min-token-out"
          value={minTokenOut}
          onChange={(e) => onMinTokenOutChange(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
    </>
  );
}
