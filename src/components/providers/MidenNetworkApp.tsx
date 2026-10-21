import { Toaster } from "sonner";
import { MidenFiSignerProvider } from "@miden-sdk/miden-wallet-adapter-react";
import { MidenProvider } from "@miden-sdk/react";
import { AllowedPrivateData } from "@miden-sdk/miden-wallet-adapter-base";
import App from "../../App";
import {
  DEFAULT_MIDEN_NETWORK,
  getMidenNetworkConfig,
} from "../../config/miden";
import { MIDEN_MAINNET_WALLET_PROVIDER_CONFIG } from "../../config/miden-wallet-compat";
import { MidenNetworkContext } from "../../hooks/useMidenNetwork";

export function MidenNetworkApp() {
  const network = DEFAULT_MIDEN_NETWORK;
  const networkConfig = getMidenNetworkConfig();

  return (
    <MidenNetworkContext.Provider value={{ network }}>
      <MidenProvider
        config={{
          rpcUrl: networkConfig.rpcUrl,
          // Public notes only need chain RPC here.
        }}
      >
        <MidenFiSignerProvider
          {...MIDEN_MAINNET_WALLET_PROVIDER_CONFIG}
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
