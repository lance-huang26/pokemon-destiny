// 邏輯自動測試：node --experimental-strip-types scripts/test-tournament.ts
import { createTournament, currentBattle, choose, ranking } from "../src/tournament.ts";
import type { Mon } from "../src/tournament.ts";

function makeMons(n: number): Mon[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    dex: i + 1,
    name: `p${i + 1}`,
    gen: 1,
    img: "",
  }));
}

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("  ✗ " + msg);
  }
}

// 每次都選左邊，把整場跑完
function runToEnd(n: number) {
  let s = createTournament(makeMons(n));
  let guard = 0;
  while (!s.champion && guard++ < n * 4) {
    const pair = currentBattle(s);
    if (!pair) break;
    s = choose(s, 0);
  }
  return s;
}

for (const n of [2, 3, 4, 5, 7, 8, 16, 72, 151, 1025]) {
  const s = runToEnd(n);
  const rank = ranking(s);
  console.log(
    `n=${n}: 冠軍=${s.champion?.name} 場次=${s.battlesDone}/${s.totalBattles} 名次數=${rank.length}`,
  );
  assert(s.champion !== null, `n=${n} 應該有冠軍`);
  assert(s.battlesDone === n - 1, `n=${n} 實際場次應為 ${n - 1}，得到 ${s.battlesDone}`);
  assert(rank.length === n, `n=${n} 名次表長度應為 ${n}，得到 ${rank.length}`);
  const ids = new Set(rank.map((r) => r.id));
  assert(ids.size === n, `n=${n} 名次表應無重複`);
  assert(rank[0].id === s.champion?.id, `n=${n} 冠軍應排第一`);
  const wins = rank.map((r) => r.wins);
  const sorted = [...wins].every((_, i) => i === 0 || wins[i - 1] >= wins[i]);
  assert(sorted, `n=${n} 名次應依 wins 遞減`);
}

console.log(failures === 0 ? "\n✅ 全部通過" : `\n❌ ${failures} 項失敗`);
process.exit(failures === 0 ? 0 : 1);
