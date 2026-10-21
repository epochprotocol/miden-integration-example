import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MIDEN_MAINNET_WALLET_PROVIDER_CONFIG } from "../src/config/miden-wallet-compat.ts";

describe("Miden mainnet wallet compatibility", () => {
  it("passes the raw mainnet wire value to the wallet provider", () => {
    assert.deepEqual(MIDEN_MAINNET_WALLET_PROVIDER_CONFIG, {
      network: "mainnet",
    });
  });
});
