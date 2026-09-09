import {
  getMidenNetworkConfig,
  MIDEN_SDK_VERSION,
  type MidenNetwork,
} from "../../config/miden";
import { useMidenNetwork } from "../../hooks/useMidenNetwork";

const NETWORKS: MidenNetwork[] = ["devnet", "testnet"];

export function Header() {
  const { network, setNetwork } = useMidenNetwork();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-100/85 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm"
          aria-hidden
        >
          M
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          Miden × Epoch
        </h1>
        <div className="ml-auto flex flex-col items-end gap-1">
          <div
            className="inline-flex rounded-lg border border-neutral-300 bg-white p-0.5 shadow-sm"
            role="group"
            aria-label="Miden network"
          >
            {NETWORKS.map((option) => {
              const active = network === option;
              const config = getMidenNetworkConfig(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  disabled={!config.enabled}
                  title={config.enabled ? undefined : config.unavailableReason}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                  onClick={() => setNetwork(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <div
            className="text-[11px] font-medium text-neutral-500"
            role="status"
          >
            {network === "devnet" ? "Devnet" : "Testnet"} · Miden SDK{" "}
            {MIDEN_SDK_VERSION}
          </div>
        </div>
      </div>
    </header>
  );
}
