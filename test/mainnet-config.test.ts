import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MIDEN_VIRTUAL_CHAIN_ID } from "@epoch-protocol/epoch-intents-sdk";
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
    assert.equal(profile.miden.chainId, MIDEN_VIRTUAL_CHAIN_ID);
    assert.equal(profile.miden.chainId, 999999999);
    assert.deepEqual(profile.miden.tokens, [
      {
        symbol: "USDCX",
        faucetId: "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24_qr7qqq9wr6w",
        decimals: 6,
      },
      {
        symbol: "ETH",
        faucetId: "mm1apqelr6tlaeftyfj4f7w59dycysmtawe_qr7qqq9wr6w",
        decimals: 18,
      },
    ]);
    assert.equal(profile.miden.rpcUrl, "https://rpc.cedar.miden.io");
    assert.equal(profile.miden.midenscanBase, "https://midenscan.com");
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
