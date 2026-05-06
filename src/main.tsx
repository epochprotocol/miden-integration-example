import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import 'sonner/dist/styles.css';
import './index.css';
import { Toaster } from 'sonner';
import App from './App';
import { config } from './config/wagmi';
import { MidenFiSignerProvider } from '@miden-sdk/miden-wallet-adapter-react';
import {
  AllowedPrivateData,
  WalletAdapterNetwork,
} from '@miden-sdk/miden-wallet-adapter-base';

const queryClient = new QueryClient();

const rkTheme = lightTheme({
  accentColor: '#ff5c00',
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  fontStack: 'system',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme}>
          <MidenFiSignerProvider
            network={WalletAdapterNetwork.Testnet}
            appName="Miden Integration Example"
            allowedPrivateData={AllowedPrivateData.Assets}
          >
            <App />
            <Toaster position="bottom-right" closeButton duration={5_000} />
          </MidenFiSignerProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
