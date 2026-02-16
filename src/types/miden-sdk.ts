/**
 * Type definitions for @miden-sdk/miden-sdk
 * These types are extracted from the SDK's WASM bindings
 */

// export interface WebClient {
//   createClient(rpcUrl: string): Promise<WebClient>;
//   syncState(): Promise<SyncSummary>;
//   newWallet(storageMode: AccountStorageMode, mutable: boolean, authSchemeId: number): Promise<Account>;
//   newFaucet(
//     storageMode: AccountStorageMode,
//     nonFungible: boolean,
//     symbol: string,
//     decimals: number,
//     maxSupply: bigint,
//     authSchemeId: number
//   ): Promise<Account>;
//   getAccount(accountId: AccountId): Promise<Account>;
//   getConsumableNotes(accountId: AccountId): Promise<InputNoteRecord[]>;
//   newMintTransactionRequest(
//     targetAccountId: AccountId,
//     faucetId: AccountId,
//     noteType: NoteType,
//     amount: bigint
//   ): TransactionRequest;
//   newSendTransactionRequest(
//     senderAccountId: AccountId,
//     receiverAccountId: AccountId,
//     faucetId: AccountId,
//     noteType: NoteType,
//     amount: bigint
//   ): TransactionRequest;
//   newConsumeTransactionRequest(noteIds: string[]): TransactionRequest;
//   submitNewTransaction(accountId: AccountId, txRequest: TransactionRequest): Promise<void>;
//   terminate(): void;
// }

// export interface TransactionProver {
//   newRemoteProver(url: string): TransactionProver;
//   free(): void;
// }

// export interface Account {
//   id(): AccountId;
//   vault(): AssetVault;
// }

// export interface AccountId {
//   toString(): string;
// }

// export interface AccountIdConstructor {
//   fromHex(hex: string): AccountId;
// }

// export interface SyncSummary {
//   blockNum(): number;
// }

// export interface AssetVault {
//   fungibleAssets(): FungibleAsset[];
// }

// export interface FungibleAsset {
//   faucetId(): AccountId;
//   amount(): bigint;
// }

// export interface InputNoteRecord {
//   id(): NoteId;
//   inputNoteRecord(): InputNoteRecord;
// }

// export interface NoteId {
//   toString(): string;
// }

// export interface AccountStorageMode {
//   public(): AccountStorageMode;
// }

// export const NoteType = {
//   Public: 'Public',
//   OffChain: 'OffChain',
// } as const;

// export type NoteType = (typeof NoteType)[keyof typeof NoteType];

// export type TransactionRequest = unknown;

// /**
//  * Miden SDK module export shape
//  */
// export interface MidenSDK {
//   WebClient: {
//     createClient(rpcUrl: string): Promise<WebClient>;
//   };
//   TransactionProver: {
//     newRemoteProver(url: string): TransactionProver;
//   };
//   AccountStorageMode: {
//     public(): AccountStorageMode;
//   };
//   AccountId: AccountIdConstructor;
//   NoteType: {
//     Public: NoteType;
//     OffChain: NoteType;
//   };
// }
