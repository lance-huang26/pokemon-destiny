// 本機端戰績儲存（localStorage）：記錄每個世代做過的前幾名。
import type { Contestant } from "./tournament";

const KEY = "pokemon-destiny:records:v1";
const TOP_N = 10;

export interface SavedMon {
  id: number;
  dex: number;
  name: string;
  img: string;
  wins: number;
}

export interface GenRecord {
  genKey: string; // "all" 或 "1".."9"
  genLabel: string;
  savedAt: number;
  top: SavedMon[];
}

export type RecordMap = Record<string, GenRecord>;

export function loadAll(): RecordMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecordMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: RecordMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // 隱私模式或空間不足時靜默略過
  }
}

export function saveRecord(
  genKey: string,
  genLabel: string,
  ranking: Contestant[],
  savedAt: number,
): void {
  const map = loadAll();
  map[genKey] = {
    genKey,
    genLabel,
    savedAt,
    top: ranking.slice(0, TOP_N).map((m) => ({
      id: m.id,
      dex: m.dex,
      name: m.name,
      img: m.img,
      wins: m.wins,
    })),
  };
  writeAll(map);
}

export function deleteRecord(genKey: string): void {
  const map = loadAll();
  delete map[genKey];
  writeAll(map);
}
