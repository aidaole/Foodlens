import type { Profile, Food } from "./food";
import { isCloudFood } from "./recognition-schema.ts";
import { restoreThumbnails, isHistoryThumbnail } from "./history-thumbnail.ts";
import { validInterests } from "./nutrition-interests.ts";
export type RecordItem = { id: string; foodId: string; date: string };
export type PersistedState = {
  profile: Profile;
  history: RecordItem[];
  saved: string[];
  onboarded: boolean;
  recognized: Food[];
  cloudConsent: boolean;
  cloudConsentRevision: string | null;
  legalAcceptance: { revision: string; at: string } | null;
  thumbnails: Record<string, string>;
};
export const emptyState = (): PersistedState => ({
  profile: { concerns: [], allergies: [] },
  history: [],
  saved: [],
  onboarded: false,
  recognized: [],
  cloudConsent: false,
  cloudConsentRevision: null,
  legalAcceptance: null,
  thumbnails: {},
});
export function appendRecognition(state: PersistedState, food: Food, thumbnail?: string): PersistedState {
  const recognized = [food, ...state.recognized.filter(f => f.id !== food.id)].slice(0, 50);
  const ids = new Set(recognized.map(f => f.id));
  const thumbnails = { ...state.thumbnails };
  // Saving a result without a new image must not erase an existing valid photo.
  if (isHistoryThumbnail(thumbnail)) thumbnails[food.id] = thumbnail;
  return {
    ...state,
    recognized,
    thumbnails: restoreThumbnails(thumbnails, [...ids]),
    saved: state.saved.filter(id => !id.startsWith("scan-") || ids.has(id)),
    history: [{ id: food.id, foodId: food.id, date: new Date().toISOString() }, ...state.history]
      .filter(r => !r.foodId.startsWith("scan-") || ids.has(r.foodId))
      .slice(0, 50),
  };
}
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
export function restoreState(value: unknown): PersistedState {
  if (!value || typeof value !== "object") return emptyState();
  const p = value as Partial<PersistedState>;
  if (
    !p.profile ||
    !strings(p.profile.concerns) ||
    !strings(p.profile.allergies) ||
    !Array.isArray(p.history) ||
    !strings(p.saved)
  )
    return emptyState();
  const recognized = Array.isArray(p.recognized) ? p.recognized.filter(isCloudFood).slice(0,50) : [];
  return {
    profile: { ...p.profile, ...(p.profile.nutritionInterests !== undefined ? {nutritionInterests: validInterests(p.profile.nutritionInterests)} : {}) },
    saved: p.saved,
    history: p.history
      .filter(
        (r) =>
          r &&
          typeof r.id === "string" &&
          typeof r.foodId === "string" &&
          typeof r.date === "string",
      )
      .slice(0, 50),
    onboarded: p.onboarded === true,
    recognized,
    thumbnails: restoreThumbnails(p.thumbnails, recognized.map(f=>f.id)),
    cloudConsent: p.cloudConsent === true,
    cloudConsentRevision: typeof p.cloudConsentRevision === 'string' ? p.cloudConsentRevision : null,
    legalAcceptance: p.legalAcceptance && typeof p.legalAcceptance.revision === 'string' && typeof p.legalAcceptance.at === 'string' && Number.isFinite(Date.parse(p.legalAcceptance.at)) ? { revision: p.legalAcceptance.revision, at: p.legalAcceptance.at } : null,
  };
}
export function revokeCloudConsent(state: PersistedState): PersistedState {
  return { ...state, cloudConsent: false, cloudConsentRevision: null };
}
