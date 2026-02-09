import { ConnectButton } from '@rainbow-me/rainbowkit';

export function EVMWalletConnect() {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">EVM Wallet</h2>
      <ConnectButton />
    </div>
  );
}
