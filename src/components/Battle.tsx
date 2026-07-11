import { useCallback, useEffect, useState } from "react";
import type { Contestant } from "../tournament";
import { playWin } from "../sound";

interface Props {
  pair: [Contestant, Contestant];
  genLabel: string;
  stage: string;
  roundBattlesDone: number;
  roundBattlesTotal: number;
  battlesDone: number;
  totalBattles: number;
  locked: boolean; // 階段動畫期間鎖定
  muted: boolean;
  canUndo: boolean;
  onToggleMute: () => void;
  onPick: (side: 0 | 1) => void;
  onUndo: () => void;
  onQuit: () => void;
}

const WIN_ANIM_MS = 550;

export default function Battle({
  pair,
  genLabel,
  stage,
  roundBattlesDone,
  roundBattlesTotal,
  battlesDone,
  totalBattles,
  locked,
  muted,
  canUndo,
  onToggleMute,
  onPick,
  onUndo,
  onQuit,
}: Props) {
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const canUndoNow = canUndo && !locked && picked === null;

  // 換對戰組合時重置動畫狀態
  useEffect(() => {
    setPicked(null);
  }, [pair[0].id, pair[1].id]);

  const select = useCallback(
    (side: 0 | 1) => {
      if (locked || picked !== null) return;
      setPicked(side);
      playWin();
      window.setTimeout(() => onPick(side), WIN_ANIM_MS);
    },
    [locked, picked, onPick],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") select(0);
      else if (e.key === "ArrowRight") select(1);
      else if (e.key === "Backspace" && canUndoNow) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select, canUndoNow, onUndo]);

  const pct = totalBattles > 0 ? Math.round((battlesDone / totalBattles) * 100) : 0;

  return (
    <div className="screen battle">
      <div className="battle-bar">
        <div className="bar-left">
          <button className="ghost" onClick={onQuit}>
            ← 換世代
          </button>
          <button className="ghost" onClick={onUndo} disabled={!canUndoNow}>
            ↩ 上一步
          </button>
        </div>
        <div className="battle-stage">
          <strong>
            {genLabel} · {stage}
          </strong>
          <span>
            本輪第 {Math.min(roundBattlesDone + 1, roundBattlesTotal)} / {roundBattlesTotal} 場 ｜
            總場次 {battlesDone} / {totalBattles}
          </span>
        </div>
        <button className="ghost mute" onClick={onToggleMute} aria-label="靜音切換">
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="battle-prompt">你比較喜歡哪一隻？（← / → 選擇，Backspace 上一步）</p>

      <div className={`arena${picked !== null ? " decided" : ""}`}>
        {pair.map((m, i) => {
          const state =
            picked === null ? "" : picked === i ? " win" : " lose";
          return (
            <button
              key={`${m.id}-${i}`}
              className={`mon-card${state}`}
              onClick={() => select(i as 0 | 1)}
              disabled={picked !== null || locked}
            >
              <div className="mon-img">
                <img src={m.img} alt={m.name} />
              </div>
              <span className="mon-name">{m.name}</span>
              <span className="mon-no">No.{String(m.dex).padStart(4, "0")}</span>
              {picked === i && <span className="win-badge">勝出！</span>}
            </button>
          );
        })}
        <div className="vs">VS</div>
      </div>
    </div>
  );
}
