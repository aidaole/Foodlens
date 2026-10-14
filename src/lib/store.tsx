import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Profile, type Food } from "./food";
import {
  emptyState,
  restoreState,
  type PersistedState,
} from "./persisted-state";
import { restoreThumbnails } from "./history-thumbnail";
export type { RecordItem } from "./persisted-state";
const KEY = "foodlens.m1";
type Store = PersistedState & {
  setProfile: (p: Profile) => void;
  addHistory: (id: string) => void;
  toggleSaved: (id: string) => void;
  clear: () => void;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  ready: boolean;
  saveRecognition: (food: Food, thumbnail?: string) => void;
  allowCloud: () => void;
  storageError: string;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageError, setError] = useState("");
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState(restoreState(JSON.parse(raw)));
      })
      .catch(() => setError("本地记录无法读取，本次可继续体验。"))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready)
      writeQueue.current = writeQueue.current
        .catch(() => {})
        .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
        .catch(() => setError("本地存储不可用，关闭后可能无法保留记录。"));
  }, [state, ready]);
  const setProfile = (profile: Profile) => setState((s) => ({ ...s, profile }));
  const addHistory = (foodId: string) =>
    setState((s) => ({
      ...s,
      history: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          foodId,
          date: new Date().toISOString(),
        },
        ...s.history,
      ].slice(0, 50),
    }));
  const toggleSaved = (id: string) =>
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((x) => x !== id)
        : [...s.saved, id],
    }));
  const allowCloud = () => setState((s) => ({ ...s, cloudConsent: true }));
  const saveRecognition = (food: Food, thumbnail?: string) =>
    setState((s) => {
      const recognized = [
        food,
        ...s.recognized.filter((f) => f.id !== food.id),
      ].slice(0, 50);
      const ids = new Set(recognized.map((f) => f.id));
      return {
        ...s,
        recognized,
        thumbnails: restoreThumbnails({...s.thumbnails, [food.id]:thumbnail}, [...ids]),
        saved: s.saved.filter((id) => !id.startsWith("scan-") || ids.has(id)),
        history: [
          { id: food.id, foodId: food.id, date: new Date().toISOString() },
          ...s.history,
        ]
          .filter((r) => !r.foodId.startsWith("scan-") || ids.has(r.foodId))
          .slice(0, 50),
      };
    });
  const clear = () =>
    setState((s) => ({ ...emptyState(), onboarded: s.onboarded }));
  const completeOnboarding = () => setState((s) => ({ ...s, onboarded: true }));
  const replayOnboarding = () => setState((s) => ({ ...s, onboarded: false }));
  return (
    <Context.Provider
      value={{
        ...state,
        ready,
        storageError,
        setProfile,
        saveRecognition,
        allowCloud,
        addHistory,
        toggleSaved,
        clear,
        completeOnboarding,
        replayOnboarding,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const v = useContext(Context);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
