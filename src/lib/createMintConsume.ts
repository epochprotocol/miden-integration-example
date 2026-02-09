// Reference implementation from Miden docs
// Used as a standalone test: import and call createMintConsume() from any component
export async function createMintConsume(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('webClient() can only run in the browser');
    return;
  }

  const { WebClient, AccountStorageMode } = await import(
    '@demox-labs/miden-sdk'
  );

  const nodeEndpoint = 'https://rpc.testnet.miden.io';
  const client = await WebClient.createClient(nodeEndpoint);

  // 1. Sync with the latest blockchain state
  const state = await client.syncState();
  console.log('Latest block number:', state.blockNum());

  // 2. Create Alice's account
  console.log('Creating account for Alice…');
  const alice = await client.newWallet(
    AccountStorageMode.public(),
    true,
    0
  );
  console.log('Alice ID:', alice.id().toString());

  // 3. Deploy a fungible faucet
  console.log('Creating faucet…');
  const faucetAccount = await client.newFaucet(
    AccountStorageMode.public(),
    false,
    "MID",
    8,
    BigInt(1_000_000),
    0
  );
  console.log('Faucet account ID:', faucetAccount.id().toString());

  console.log('Setup complete.');
}
