import { useState } from "react";
import type { Contestant } from "../tournament";
import { drawShareCard } from "../shareCard";

interface Props {
  ranking: Contestant[];
  genLabel: string;
  canUndo: boolean;
  onUndo: () => void;
  onReplay: () => void;
  onHome: () => void;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Result({ ranking, genLabel, canUndo, onUndo, onReplay, onHome }: Props) {
  const champ = ranking[0];
  const rest = ranking.slice(1, 10);
  const [saving, setSaving] = useState(false);

  const handleDownload = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const blob = await drawShareCard(ranking, genLabel);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `命定寶可夢-${champ?.name ?? "冠軍"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("產生分享圖失敗，請再試一次。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen result">
      <p className="result-kicker">{genLabel}｜你的命定寶可夢是……</p>

      {champ && (
        <div className="champion">
          <div className="champion-img">
            <img src={champ.img} alt={champ.name} />
          </div>
          <div className="champion-name">
            <span className="crown">👑</span>
            {champ.name}
          </div>
          <span className="champion-no">No.{String(champ.dex).padStart(4, "0")}</span>
        </div>
      )}

      <h2 className="rank-title">最愛排行榜 TOP 10</h2>
      <ol className="rank-list">
        {rest.map((m, i) => (
          <li key={m.id}>
            <span className="rank-no">{MEDAL[i + 1] ?? i + 2}</span>
            <img src={m.img} alt={m.name} loading="lazy" />
            <span className="rank-name">{m.name}</span>
            <span className="rank-wins">{m.wins} 勝</span>
          </li>
        ))}
      </ol>

      <div className="result-actions">
        <button className="primary" onClick={handleDownload} disabled={saving}>
          {saving ? "產生中…" : "📸 下載冠軍分享圖"}
        </button>
        {canUndo && (
          <button className="ghost" onClick={onUndo}>
            ↩ 上一步（重選冠軍）
          </button>
        )}
        <button className="ghost" onClick={onReplay}>
          再玩一次（同世代）
        </button>
        <button className="ghost" onClick={onHome}>
          選其他世代
        </button>
      </div>
    </div>
  );
}
