import { useCallback, useEffect, useRef, useState } from "react";
import rawData from "./data/pokemon.json";
import type { Mon, TournamentState } from "./tournament";
import { choose, createTournament, currentBattle, ranking, stageLabel } from "./tournament";
import { isMuted, playChampion, playStage, setMuted as setMutedGlobal } from "./sound";
import GenSelect from "./components/GenSelect";
import Battle from "./components/Battle";
import Result from "./components/Result";
import "./App.css";

const DATA = rawData as Mon[];

export default function App() {
  const [gen, setGen] = useState<number | "all">(1);
  const [state, setState] = useState<TournamentState | null>(null);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const lastRound = useRef(0);
  const championFired = useRef(false);

  const start = useCallback((g: number | "all") => {
    const mons = g === "all" ? DATA : DATA.filter((m) => m.gen === g);
    setGen(g);
    lastRound.current = 0;
    championFired.current = false;
    setOverlay(null);
    setState(createTournament(mons));
  }, []);

  const pick = useCallback((side: 0 | 1) => {
    setState((prev) => (prev ? choose(prev, side) : prev));
  }, []);

  const goHome = useCallback(() => {
    setState(null);
    setOverlay(null);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMutedGlobal(next);
      return next;
    });
  }, []);

  // 進入新一輪 → 顯示階段動畫 + 號角
  useEffect(() => {
    if (!state || state.champion) return;
    if (state.round !== lastRound.current) {
      lastRound.current = state.round;
      setOverlay(stageLabel(state.roundSize));
      playStage();
    }
  }, [state]);

  // 階段動畫 2.2 秒後自動收起
  useEffect(() => {
    if (overlay == null) return;
    const t = window.setTimeout(() => setOverlay(null), 2200);
    return () => window.clearTimeout(t);
  }, [overlay]);

  // 冠軍誕生音效（只播一次）
  useEffect(() => {
    if (state?.champion && !championFired.current) {
      championFired.current = true;
      playChampion();
    }
  }, [state]);

  const genLabel = gen === "all" ? "全國圖鑑" : `第 ${gen} 世代`;

  if (!state) return <GenSelect data={DATA} onStart={start} />;

  if (state.champion) {
    return (
      <Result
        ranking={ranking(state)}
        genLabel={genLabel}
        onReplay={() => start(gen)}
        onHome={goHome}
      />
    );
  }

  const pair = currentBattle(state);
  if (!pair) return <GenSelect data={DATA} onStart={start} />;

  const isPrelim = overlay === "初賽";

  return (
    <>
      <Battle
        pair={pair}
        genLabel={genLabel}
        stage={stageLabel(state.roundSize)}
        roundBattlesDone={state.roundBattlesDone}
        roundBattlesTotal={state.roundBattlesTotal}
        battlesDone={state.battlesDone}
        totalBattles={state.totalBattles}
        locked={overlay != null}
        muted={muted}
        onToggleMute={toggleMute}
        onPick={pick}
        onQuit={goHome}
      />
      {overlay && (
        <div className="stage-overlay" key={state.round}>
          <div className="stage-overlay-inner">
            <span className="stage-kick">{isPrelim ? "準備開始" : "進入"}</span>
            <span className="stage-big">{overlay}</span>
          </div>
        </div>
      )}
    </>
  );
}
