import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EPOCH_TESTNET_EVM_CHAINS,
  getTestnetChainName,
} from "../../../constants/chains";
import { EPOCH_TESTNET_TOKENS } from "../../../constants/evm-tokens";

export interface IntentDestination {
  outputToken: string;
  minTokenOut: string;
  chainId: string;
  evmAddress: string;
}

interface Props {
  values: IntentDestination;
  onChange: (key: keyof IntentDestination, value: string) => void;
}

export function IntentDestinationFields({ values, onChange }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Output token ({getTestnetChainName(values.chainId)})</Label>
          <SelectRoot
            value={values.outputToken}
            onValueChange={(v) => onChange("outputToken", v)}
          >
            <SelectTrigger aria-label="Select output token">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              {EPOCH_TESTNET_TOKENS.map((token) => (
                <SelectItem key={token.symbol} value={token.address}>
                  {token.symbol}
                  {token.address ? ` · ${token.address.slice(0, 10)}…` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <div>
          <Label htmlFor="intent-min-out">Min output amount</Label>
          <Input
            id="intent-min-out"
            value={values.minTokenOut}
            onChange={(e) => onChange("minTokenOut", e.target.value)}
            placeholder="e.g. 10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Destination chain</Label>
          <SelectRoot
            value={values.chainId}
            onValueChange={(v) => onChange("chainId", v)}
          >
            <SelectTrigger aria-label="Select destination chain">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              {EPOCH_TESTNET_EVM_CHAINS.map((chain) => (
                <SelectItem key={chain.id} value={String(chain.id)}>
                  {chain.name} ({chain.id})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
      </div>

      <div>
        <Label htmlFor="intent-evm">Destination (EVM wallet)</Label>
        <Input
          id="intent-evm"
          value={values.evmAddress}
          onChange={(e) => onChange("evmAddress", e.target.value)}
          variant="dim"
          className="font-mono text-[13px]"
          placeholder="0x…"
        />
      </div>
    </>
  );
}
