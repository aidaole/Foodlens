export type Counter = {
  day: string;
  total: number;
  clients: Record<string, number>;
  ips: Record<string, number>;
};
export function reserve(
  previous: Counter | undefined,
  day: string,
  id: string,
  ip: string,
  globalLimit: number,
  deviceLimit: number,
) {
  const state: Counter =
    previous?.day === day ? previous : { day, total: 0, clients: {}, ips: {} };
  if (state.total >= globalLimit) return { ok: false, state };
  if (
    (state.clients[id] ?? 0) >= deviceLimit ||
    (state.ips[ip] ?? 0) >= deviceLimit
  )
    return { ok: false, state };
  return {
    ok: true,
    state: {
      day,
      total: state.total + 1,
      clients: { ...state.clients, [id]: (state.clients[id] ?? 0) + 1 },
      ips: { ...state.ips, [ip]: (state.ips[ip] ?? 0) + 1 },
    },
  };
}
