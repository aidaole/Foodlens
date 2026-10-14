import type { Profile, Food } from "./food";
import { isCloudFood } from "./recognition-schema.ts";
import { restoreThumbnails } from "./history-thumbnail.ts";
import { validInterests } from "./nutrition-interests.ts";
export type RecordItem = { id: string; foodId: string; date: string };
export type PersistedState = {
  profile: Profile;
  history: RecordItem[];
  saved: string[];
  onboarded: boolean;
  recognized: Food[];
  cloudConsent: boolean;
  thumbnails: Record<string, string>;
};
export const emptyState = (): PersistedState => ({
  profile: { concerns: [], allergies: [] },
  history: [],
  saved: [],
  onboarded: false,
  recognized: [],
  cloudConsent: false,
  thumbnails: {},
});
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
  };
}
