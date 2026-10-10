import {
  AdviceMap,
  Felt,
  FeltArray,
  Poseidon2,
  Word,
  type TransactionRequestBuilder,
} from "@miden-sdk/miden-sdk";

export interface MultisigAuthArgs {
  boundBlockNum: number;
  salt: bigint[];
  feeFaucetPrefix: bigint;
  feeFaucetSuffix: bigint;
}

export function randomMultisigSalt(): bigint[] {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), BigInt);
}

/**
 * What `feeAwareTransactionRequestBuilder` adds for a multisig account, built
 * by hand because the wallet's Guardian account is private and this client
 * cannot load it.
 */
export function withMultisigAuthArgs(
  builder: TransactionRequestBuilder,
  args: MultisigAuthArgs,
): TransactionRequestBuilder {
  // [bound block, no approval expiry, 0, 0] || SALT || 1:1 fee conversion info
  const preimage = [
    BigInt(args.boundBlockNum),
    0n,
    0n,
    0n,
    ...args.salt,
    args.feeFaucetSuffix,
    args.feeFaucetPrefix,
    1n,
    1n,
  ];
  // Felt handles are moved into WASM, so every array gets fresh ones.
  const toFeltArray = () => new FeltArray(preimage.map((v) => new Felt(v)));
  const commitmentHex = Poseidon2.hashElements(toFeltArray()).toHex();

  const adviceMap = new AdviceMap();
  adviceMap.insert(Word.fromHex(commitmentHex), toFeltArray());

  return builder
    .withAuthArg(Word.fromHex(commitmentHex))
    .extendAdviceMap(adviceMap)
    .withBlockNumbers([args.boundBlockNum]);
}
