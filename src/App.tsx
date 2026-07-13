import { useCallback, useEffect, useRef, useState } from "react";
import rawData from "./data/pokemon.json";
import type { Mon, TournamentState } from "./tournament";
import { choose, createTournament, currentBattle, ranking, stageLabel } from "./tournament";
import { isMuted, playChampion, playStage, setMuted as setMutedGlobal } from "./sound";
import { loadAll, saveRecord } from "./storage";
import GenSelect from "./components/GenSelect";
import Battle from "./components/Battle";
import Result from "./components/Result";
import Records from "./components/Records";
import "./App.css";

const DATA = rawData as Mon[];

export default function App() {
  const [gen, setGen] = useState<number | "all">(1);
  const [state, setState] = useState<TournamentState | null>(null);
  const [history, setHistory] = useState<TournamentState[]>([]); // 每一步的賽況快照，供「上一步」回退
  const [showRecords, setShowRecords] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const lastRound = useRef(0);
  const championFired = useRef(false);
  const playCounted = useRef(false); // 本局是否已計入「做過次數」（避免上一步重選灌水）

  const start = useCallback((g: number | "all") => {
    const mons = g === "all" ? DATA : DATA.filter((m) => m.gen === g);
    setGen(g);
    lastRound.current = 0;
    championFired.current = false;
    playCounted.current = false;
    setOverlay(null);
    setHistory([]);
    setShowRecords(false);
    setState(createTournament(mons));
  }, []);

  const pick = useCallback(
    (side: 0 | 1) => {
      if (!state) return;
      setHistory((h) => [...h, state]); // 前進前先存檔
      setState(choose(state, side));
    },
    [state],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    lastRound.current = prev.round; // 回退不要再觸發階段動畫
    championFired.current = false; // 若從冠軍返回，之後可再次播放音效
    setOverlay(null);
    setState(prev);
    setHistory(history.slice(0, -1));
  }, [history]);

  const goHome = useCallback(() => {
    setState(null);
    setOverlay(null);
    setHistory([]);
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

  const genLabel = gen === "all" ? "全國圖鑑" : `第 ${gen} 世代`;

  // 冠軍誕生：播音效並存進本機紀錄
  useEffect(() => {
    if (state?.champion && !championFired.current) {
      championFired.current = true;
      playChampion();
      const genKey = gen === "all" ? "all" : String(gen);
      const prevPlays = loadAll()[genKey]?.plays ?? 0;
      const plays = prevPlays + (playCounted.current ? 0 : 1); // 上一步重選冠軍不重複計次
      playCounted.current = true;
      saveRecord(genKey, genLabel, ranking(state), Date.now(), plays);
    }
  }, [state, gen, genLabel]);

  if (!state) {
    if (showRecords) {
      return (
        <Records
          onBack={() => setShowRecords(false)}
          onReplay={(g) => start(g)}
        />
      );
    }
    return (
      <GenSelect
        data={DATA}
        records={loadAll()}
        onStart={start}
        onOpenRecords={() => setShowRecords(true)}
      />
    );
  }

  if (state.champion) {
    return (
      <Result
        ranking={ranking(state)}
        genLabel={genLabel}
        canUndo={history.length > 0}
        onUndo={undo}
        onReplay={() => start(gen)}
        onHome={goHome}
      />
    );
  }

  const pair = currentBattle(state);
  if (!pair) {
    return (
      <GenSelect
        data={DATA}
        records={loadAll()}
        onStart={start}
        onOpenRecords={() => setShowRecords(true)}
      />
    );
  }

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
        canUndo={history.length > 0}
        onToggleMute={toggleMute}
        onPick={pick}
        onUndo={undo}
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
