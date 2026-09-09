import { useState } from "react";
import { Header } from "./components/layout/Header";
import { TabNav } from "./components/layout/TabNav";
import { CrosschainTab } from "./components/tabs/CrosschainTab";
import { WithdrawTab } from "./components/tabs/WithdrawTab";
import { useMidenWalletAdapter } from "./hooks/useMidenWalletAdapter";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function App() {
  const [activeTab, setActiveTab] = useState("crosschain");
  const [midenConnectError, setMidenConnectError] = useState<string | null>(
    null,
  );
  const midenWallet = useMidenWalletAdapter({ enabled: true });

  const connectMidenWallet = async () => {
    setMidenConnectError(null);
    try {
      await midenWallet.connect();
    } catch (error) {
      setMidenConnectError(
        error instanceof Error
          ? error.message
          : "Unable to connect Miden wallet.",
      );
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 pb-14">
        <div className="flex flex-col gap-4">
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabledTabs={
              midenWallet.connected
                ? undefined
                : {
                    withdraw: "Connect Miden wallet to enable Withdraw.",
                  }
            }
          />

          <section className="ui-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Wallets
                </div>
                <div className="text-sm text-neutral-700">
                  Connect both to run end-to-end flows. EVM pays gas on any
                  Epoch testnet chain; Miden provides/receives notes.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  EVM wallet
                </div>
                <div className="mt-2">
                  <ConnectButton />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Miden wallet
                    </div>
                    <div className="mt-1 font-mono text-[12px] text-neutral-700 break-all">
                      {midenWallet.connected
                        ? (midenWallet.accountId?.hex ?? "connected")
                        : "not connected"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void connectMidenWallet()}
                    disabled={
                      midenWallet.connected ||
                      midenWallet.connecting ||
                      !midenWallet.walletReady
                    }
                  >
                    {midenWallet.connected
                      ? "Connected"
                      : midenWallet.connecting
                        ? "Connecting…"
                        : midenWallet.walletReady
                          ? "Connect"
                          : "Preparing…"}
                  </Button>
                </div>
                {!midenWallet.connected && (
                  <div className="mt-2 text-xs text-neutral-500">
                    {midenWallet.walletDetected
                      ? "Preparing the Miden wallet connection…"
                      : "Miden wallet extension not detected. Unlock or refresh the extension, then reload this page."}
                  </div>
                )}
                {midenConnectError && (
                  <div className="mt-2 text-xs text-red-600" role="alert">
                    {midenConnectError}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {activeTab === "crosschain" && <CrosschainTab />}
        {activeTab === "withdraw" && <WithdrawTab />}
      </main>
    </div>
  );
}

export default App;
