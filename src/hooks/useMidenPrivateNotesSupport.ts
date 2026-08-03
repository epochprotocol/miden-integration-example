import { useQuery } from "@tanstack/react-query";
import { EPOCH_API_BASE_URL } from "../lib/epoch-sdk";

/**
 * Whether the allocator can accept a PRIVATE collateral note.
 *
 * A private note publishes only its commitment, so the allocator needs the note
 * body sent alongside the intent to validate it and later consume it. An
 * allocator that does not accept `midenNoteBytes` cannot do either, and the
 * minted note would be stranded — the SDK refuses such a mint, and this hook
 * lets the UI disable the option instead of failing at confirm time.
 *
 * Older allocators omit the flag entirely, which reads as unsupported.
 */
export function useMidenPrivateNotesSupport(): {
  isSupported: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["midenPrivateNotesSupport", EPOCH_API_BASE_URL],
    queryFn: async (): Promise<boolean> => {
      const res = await fetch(`${EPOCH_API_BASE_URL}/miden-recipient`);
      if (!res.ok) return false;
      const json = (await res.json()) as {
        midenPrivateNotesSupported?: boolean;
      };
      return json?.midenPrivateNotesSupported === true;
    },
    // Allocator capability is static for a deployment; don't refetch on focus.
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return { isSupported: data === true, isLoading };
}
