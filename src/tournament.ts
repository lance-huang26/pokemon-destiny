// 單淘汰賽引擎（純函式，無 UI 依賴）
// 採「2 的次方」賽制：不足 2 次方時，第一輪（初賽）安排輪空，讓之後每輪都是
// 64 → 32 → 16 → 8 → 4(準決賽) → 2(決賽) 的乾淨對半。
// 名次依「晉級輪數（wins）」由高到低排序；同分者以較晚被淘汰者為優先。

export interface Mon {
  id: number; // 唯一鍵（一般寶可夢＝全國編號；地區型態＝PokeAPI form 的 pokemon id）
  dex: number; // 顯示用的全國圖鑑編號（地區型態沿用其原始物種編號）
  name: string;
  gen: number;
  img: string;
}

export interface Contestant extends Mon {
  wins: number; // 晉級過幾輪（含輪空）
}

export interface TournamentState {
  queue: Contestant[]; // 本輪尚未對戰者，front 兩隻即當前對戰
  nextRound: Contestant[]; // 已晉級到下一輪者
  eliminated: Contestant[]; // 已淘汰者（依淘汰順序）
  champion: Contestant | null;
  round: number; // 第幾輪（1-based）
  roundSize: number; // 本輪參賽數（用來顯示「幾強／初賽」）
  roundBattlesTotal: number; // 本輪要打幾場
  roundBattlesDone: number; // 本輪已打幾場
  totalBattles: number; // 全程實際對戰場次 = n - 1
  battlesDone: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isPow2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function ceilPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function empty(champion: Contestant | null): TournamentState {
  return {
    queue: [],
    nextRound: [],
    eliminated: [],
    champion,
    round: 0,
    roundSize: 0,
    roundBattlesTotal: 0,
    roundBattlesDone: 0,
    totalBattles: 0,
    battlesDone: 0,
  };
}

export function createTournament(mons: Mon[]): TournamentState {
  const contestants = shuffle(mons).map((m) => ({ ...m, wins: 0 }));
  const n = contestants.length;
  if (n <= 1) return empty(contestants[0] ?? null);

  // 補到最近的 2 次方，差額由第一輪輪空吸收
  const byes = ceilPow2(n) - n;
  const byeMons = contestants.slice(0, byes).map((m) => ({ ...m, wins: 1 })); // 輪空也算晉級一輪
  const players = contestants.slice(byes); // 一定是偶數

  return {
    queue: players,
    nextRound: byeMons,
    eliminated: [],
    champion: null,
    round: 1,
    roundSize: n,
    roundBattlesTotal: players.length / 2,
    roundBattlesDone: 0,
    totalBattles: n - 1,
    battlesDone: 0,
  };
}

export function currentBattle(s: TournamentState): [Contestant, Contestant] | null {
  return s.queue.length >= 2 ? [s.queue[0], s.queue[1]] : null;
}

// side: 0 = 左（queue[0]）、1 = 右（queue[1]）
export function choose(s: TournamentState, side: 0 | 1): TournamentState {
  if (s.queue.length < 2 || s.champion) return s;

  const [a, b] = [s.queue[0], s.queue[1]];
  const winner = side === 0 ? a : b;
  const loser = side === 0 ? b : a;

  let queue = s.queue.slice(2);
  let nextRound = [...s.nextRound, { ...winner, wins: winner.wins + 1 }];
  const eliminated = [...s.eliminated, loser];
  const battlesDone = s.battlesDone + 1;

  let { round, roundSize, roundBattlesTotal } = s;
  let roundBattlesDone = s.roundBattlesDone + 1;

  if (queue.length === 0) {
    // 本輪結束
    if (nextRound.length === 1) {
      return {
        ...empty(nextRound[0]),
        eliminated,
        totalBattles: s.totalBattles,
        battlesDone,
      };
    }
    // 進入下一輪（此時 nextRound 必為 2 的次方，全部對戰、無輪空）
    round += 1;
    roundSize = nextRound.length;
    roundBattlesTotal = nextRound.length / 2;
    roundBattlesDone = 0;
    queue = nextRound;
    nextRound = [];
  }

  return {
    queue,
    nextRound,
    eliminated,
    champion: null,
    round,
    roundSize,
    roundBattlesTotal,
    roundBattlesDone,
    totalBattles: s.totalBattles,
    battlesDone,
  };
}

export function stageLabel(roundSize: number): string {
  if (!isPow2(roundSize)) return "初賽"; // 只有第一輪（補洞的那輪）會非 2 次方
  if (roundSize === 2) return "決賽";
  if (roundSize === 4) return "準決賽";
  return `${roundSize} 強`;
}

// 最終名次：冠軍第一，其餘依 wins 由高到低（同分時較晚淘汰者在前）
export function ranking(s: TournamentState): Contestant[] {
  const all: Contestant[] = [];
  if (s.champion) all.push(s.champion);
  for (let i = s.eliminated.length - 1; i >= 0; i--) all.push(s.eliminated[i]);
  return all.slice().sort((x, y) => y.wins - x.wins); // 穩定排序保留「較晚淘汰在前」
}
