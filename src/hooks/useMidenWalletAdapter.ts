import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMidenFiWallet } from "@miden-sdk/miden-wallet-adapter-react";
import { useAssetMetadata } from "@miden-sdk/react";
import { AccountId, Address } from "@miden-sdk/miden-sdk";

export interface NormalizedMidenAccountId {
  hex: string;
}

export interface MidenWalletAsset {
  assetId: string; // faucet id
  assetIdDisplay: string;
  amount: bigint;
  symbol?: string;
}

export interface UseMidenWalletAdapterOptions {
  enabled?: boolean;
}

export interface UseMidenWalletAdapterResult {
  connected: boolean;
  connect: () => Promise<void>;
  address: string | null;
  accountId: NormalizedMidenAccountId | null;
  assets: MidenWalletAsset[];
  isLoadingAssets: boolean;
  assetsError: string | null;
  refreshAssets: () => Promise<void>;
}

const normalizeAccountId = (
  rawAddress: string | null,
): NormalizedMidenAccountId | null => {
  if (!rawAddress) return null;
  const input = rawAddress.replace(/\s+/g, "").trim();
  if (!input) return null;

  let id: AccountId | null = null;
  try {
    if (input.startsWith("0x") || input.startsWith("0X")) {
      id = AccountId.fromHex(input);
    } else if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) {
      id = AccountId.fromHex(`0x${input}`);
    }
  } catch {
    id = null;
  }

  if (!id) {
    if (input.includes("_")) {
      try {
        id = Address.fromBech32(input).accountId();
      } catch {
        const accountBech32 = input.slice(0, input.indexOf("_"));
        try {
          id = AccountId.fromBech32(accountBech32);
        } catch {
          id = null;
        }
      }
    } else {
      try {
        id = AccountId.fromBech32(input);
      } catch {
        try {
          id = Address.fromBech32(input).accountId();
        } catch {
          id = null;
        }
      }
    }
  }

  if (!id) return null;
  try {
    return { hex: id.toString() };
  } catch {
    return null;
  }
};

export function useMidenWalletAdapter(
  options: UseMidenWalletAdapterOptions = {},
): UseMidenWalletAdapterResult {
  const { enabled = true } = options;
  const {
    connected,
    connect: adapterConnect,
    address,
    requestAssets,
  } = useMidenFiWallet();

  const accountId = useMemo(() => normalizeAccountId(address), [address]);

  // Keyed on address so App + the active tab share one requestAssets() call.
  const {
    data: rawAssets,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["midenAssets", address],
    queryFn: async () => (await requestAssets!()) ?? [],
    enabled: enabled && connected && !!address && !!requestAssets,
    // requestAssets() opens the wallet's approval prompt, so it must never
    // refetch automatically. Only an address change, a bridge's
    // invalidateQueries, or refreshAssets() should trigger it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const unsupported = enabled && connected && !requestAssets;
  const assetsError = unsupported
    ? "Connected wallet does not support requestAssets()"
    : error
      ? error instanceof Error
        ? error.message
        : "Failed to load assets"
      : null;

  const refreshAssets = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const faucetIds = useMemo(
    () => (rawAssets ?? []).map((a) => a.faucetId),
    [rawAssets],
  );
  const { assetMetadata } = useAssetMetadata(faucetIds);

  const assets = useMemo<MidenWalletAsset[]>(
    () =>
      (rawAssets ?? []).map((a) => {
        const meta = assetMetadata.get(a.faucetId);
        let display = a.faucetId;
        try {
          display = normalizeAccountId(a.faucetId)?.hex ?? a.faucetId;
        } catch {
          // keep raw faucetId
        }
        return {
          assetId: a.faucetId,
          assetIdDisplay: display,
          amount: BigInt(a.amount),
          symbol: meta?.symbol,
        };
      }),
    [rawAssets, assetMetadata],
  );

  const connect = useCallback(async () => {
    if (!connected) await adapterConnect();
  }, [connected, adapterConnect]);

  return {
    connected,
    connect,
    address,
    accountId,
    assets,
    isLoadingAssets: isFetching,
    assetsError,
    refreshAssets,
  };
}
