import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mainnetGraph } from "@epoch-protocol/epoch-commons-sdk";
import { isPragmaSupportedMidenAsset } from "../src/constants/miden-tokens.ts";
import { getDeploymentProfile } from "../src/config/deployment.ts";

describe("Miden mainnet configuration", () => {
  it("routes the demo through canonical Base USDC and Cedar Miden assets", () => {
    const profile = getDeploymentProfile();

    assert.deepEqual(profile.evmChains, [{ id: 8453, name: "Base" }]);
    assert.deepEqual(profile.evmTokens, [
      {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
    ]);
    assert.equal(profile.miden.chainId, mainnetGraph.chains.Miden.chainId);
    assert.equal(profile.miden.chainId, 999999999);
    assert.deepEqual(profile.miden.tokens, [
      {
        symbol: "USDCX",
        faucetId: mainnetGraph.tokens.USDCX.contractAddress.Miden,
        decimals: mainnetGraph.tokens.USDCX.decimals,
      },
      {
        symbol: "ETH",
        faucetId: mainnetGraph.tokens.WETH.contractAddress.Miden,
        decimals: mainnetGraph.tokens.WETH.decimals,
      },
    ]);
    assert.equal(profile.miden.rpcUrl, "https://rpc.cedar.miden.io");
    assert.equal(
      profile.miden.midenscanBase,
      mainnetGraph.chains.Miden.explorer,
    );
  });

  it("accepts non-empty public runtime endpoint overrides", () => {
    const profile = getDeploymentProfile({
      VITE_EPOCH_API_BASE_URL: " https://api.example.test ",
      VITE_MIDEN_RPC_URL: " https://rpc.example.test ",
    });

    assert.equal(profile.epoch.apiBaseUrl, "https://api.example.test");
    assert.equal(profile.miden.rpcUrl, "https://rpc.example.test");
  });
});

it("accepts only canonical mainnet faucet IDs even when metadata symbols are spoofed", () => {
  const profile = getDeploymentProfile();
  const usdcx = profile.miden.tokens.find((token) => token.symbol === "USDCX");
  assert.ok(usdcx);
  assert.equal(
    isPragmaSupportedMidenAsset(
      { assetId: usdcx.faucetId, symbol: "USDCX" },
      "mainnet",
    ),
    true,
  );
  assert.equal(
    isPragmaSupportedMidenAsset(
      { assetId: "0xcee345d29e1ccf0177307b63f94a5a", symbol: "USDCX" },
      "mainnet",
    ),
    false,
  );
});
