import { ConnectButton } from '@rainbow-me/rainbowkit';

export function EVMWalletConnect() {
  return (
    <div className="ui-card">
      <h2 className="text-lg font-semibold text-neutral-900">EVM wallet</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Required for Epoch intents: signing and funding on an Epoch testnet EVM chain. Connect the wallet that should pay gas and hold
        destination tokens. Switch networks in your wallet to use Base Sepolia, Optimism Sepolia, or Polygon Amoy.
      </p>
      <div className="mt-4">
        <ConnectButton />
      </div>
    </div>
  );
}
