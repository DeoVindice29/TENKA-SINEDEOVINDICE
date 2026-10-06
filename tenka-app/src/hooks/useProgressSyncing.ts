import { useSyncExternalStore } from "react";
import {
  isProgressSyncing,
  subscribeProgressSync,
} from "@/data/progressAccount";

/** true selama progres pangkat/misi akun masih ditarik dari Supabase. */
export function useProgressSyncing(): boolean {
  return useSyncExternalStore(
    subscribeProgressSync,
    isProgressSyncing,
    () => false,
  );
}
