import { createContext, useContext } from "react";
import type { MidenNetwork } from "../config/miden";

export interface MidenNetworkContextValue {
  network: MidenNetwork;
  setNetwork: (network: MidenNetwork) => void;
}

export const MidenNetworkContext =
  createContext<MidenNetworkContextValue | null>(null);

export function useMidenNetwork(): MidenNetworkContextValue {
  const value = useContext(MidenNetworkContext);
  if (!value) {
    throw new Error("useMidenNetwork must be used inside MidenNetworkContext");
  }
  return value;
}
