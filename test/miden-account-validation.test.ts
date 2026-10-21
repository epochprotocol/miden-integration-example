import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEpochTaskDataParams,
  buildEVMToMidenTaskDataParams,
} from "../src/services/epoch-bridge.ts";

const PUBLIC_ACCOUNT = "0xfa487ba0a7be215127692531a14765";
const PRIVATE_ACCOUNT = "0x7df7d81cde530f814e34b3a7a14d12";
const MIDEN_FAUCET = "0x2458e5446128e6b150b75b8ebd9ce1";
const EVM_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

describe("Miden public account validation", () => {
  it("accepts a public connected source account before a Miden-to-EVM quote", () => {
    assert.doesNotThrow(() =>
      buildEpochTaskDataParams({
        midenAccountId: PUBLIC_ACCOUNT,
        midenFaucetId: MIDEN_FAUCET,
        evmRecipient: EVM_ADDRESS,
        destinationChainId: 8453,
        outputTokenAddress: EVM_ADDRESS,
        minTokenOut: "1",
      }),
    );
  });

  it("rejects a private connected source account before a Miden-to-EVM quote", () => {
    assert.throws(
      () =>
        buildEpochTaskDataParams({
          midenAccountId: PRIVATE_ACCOUNT,
          midenFaucetId: MIDEN_FAUCET,
          evmRecipient: EVM_ADDRESS,
          destinationChainId: 8453,
          outputTokenAddress: EVM_ADDRESS,
          minTokenOut: "1",
        }),
      /Miden source account must be public/,
    );
  });

  it("rejects a private manually entered destination account before an EVM-to-Miden quote", () => {
    assert.throws(
      () =>
        buildEVMToMidenTaskDataParams({
          sourceChainId: 8453,
          destinationChainId: 999999999,
          evmSourceAddress: EVM_ADDRESS,
          evmTokenAddress: EVM_ADDRESS,
          midenRecipientId: PRIVATE_ACCOUNT,
          midenFaucetId: MIDEN_FAUCET,
          minTokenOut: "1",
        }),
      /Miden destination account must be public/,
    );
  });
});
