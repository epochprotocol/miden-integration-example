import type { ReactNode } from 'react';
import { useAccount } from '@miden-sdk/react';
import type { MidenAccount } from '../../types/miden';

interface Props {
  account: MidenAccount;
}

/**
 * One row of balances; `useAccount` subscribes to the Miden store and refetches after `useSyncState().sync()`.
 */
export function BalanceAccountRow({ account }: Props) {
  const { assets, isLoading, error } = useAccount(account.id);

  let body: ReactNode;
  if (error) {
    body = <div className="text-sm text-red-700">{error.message}</div>;
  } else if (isLoading && assets.length === 0) {
    body = <div className="text-sm italic text-neutral-500">Loading…</div>;
  } else if (assets.length === 0) {
    body = <div className="text-sm italic text-neutral-500">No assets</div>;
  } else {
    body = (
      <div className="space-y-1">
        {assets.map((a) => (
          <div key={a.assetId} className="flex justify-between text-sm">
            <span className="min-w-0 break-all font-mono text-neutral-600">
              {a.symbol ?? a.assetId}
            </span>
            <span className="shrink-0 pl-2 font-semibold text-neutral-900">{a.amount.toString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="mb-1 text-sm text-neutral-600">{account.label}</div>
      <div className="mb-2 break-all font-mono text-xs text-neutral-500">{account.id}</div>
      {body}
    </div>
  );
}
