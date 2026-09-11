import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import "sonner/dist/styles.css";
import "./index.css";
import { config } from "./config/wagmi";
import { MidenNetworkApp } from "./components/providers/MidenNetworkApp";

const queryClient = new QueryClient();

const rkTheme = lightTheme({
  accentColor: "#ff5c00",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  fontStack: "system",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme}>
          <MidenNetworkApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
