import { useCallback, useState } from "react";
import { Toaster } from "sonner";
import { MidenFiSignerProvider } from "@miden-sdk/miden-wallet-adapter-react";
import { MidenProvider } from "@miden-sdk/react";
import {
  AllowedPrivateData,
  WalletAdapterNetwork,
} from "@miden-sdk/miden-wallet-adapter-base";
import App from "../../App";
import {
  DEFAULT_MIDEN_NETWORK,
  getMidenNetworkConfig,
  MIDEN_NETWORK_STORAGE_KEY,
  type MidenNetwork,
} from "../../config/miden";
import { MidenNetworkContext } from "../../hooks/useMidenNetwork";

function initialMidenNetwork(): MidenNetwork {
  const stored = window.localStorage.getItem(MIDEN_NETWORK_STORAGE_KEY);
  return (stored === "testnet" || stored === "devnet") &&
    getMidenNetworkConfig(stored).enabled
    ? stored
    : DEFAULT_MIDEN_NETWORK;
}

export function MidenNetworkApp() {
  const [network, setNetworkState] =
    useState<MidenNetwork>(initialMidenNetwork);
  const networkConfig = getMidenNetworkConfig(network);
  const setNetwork = useCallback((next: MidenNetwork) => {
    if (!getMidenNetworkConfig(next).enabled) return;
    window.localStorage.setItem(MIDEN_NETWORK_STORAGE_KEY, next);
    setNetworkState(next);
  }, []);

  return (
    <MidenNetworkContext.Provider value={{ network, setNetwork }}>
      <MidenProvider
        key={network}
        config={{
          rpcUrl: networkConfig.rpcUrl,
          // P2IDE collateral notes are public and are submitted by the
          // wallet. The app client only needs chain RPC for the current
          // block height. Leaving note transport unset prevents its private
          // note polling endpoint from blocking client initialization.
        }}
      >
        <MidenFiSignerProvider
          key={network}
          network={
            network === "devnet"
              ? WalletAdapterNetwork.Devnet
              : WalletAdapterNetwork.Testnet
          }
          appName="Miden Integration Example"
          allowedPrivateData={AllowedPrivateData.Assets}
        >
          <App />
        </MidenFiSignerProvider>
      </MidenProvider>
      <Toaster position="bottom-right" closeButton duration={5_000} />
    </MidenNetworkContext.Provider>
  );
}
