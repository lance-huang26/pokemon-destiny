import { useMemo, useState } from "react";
import { deleteRecord, loadAll } from "../storage";
import type { GenRecord } from "../storage";
import { drawShareCard } from "../shareCard";

interface Props {
  onBack: () => void;
  onReplay: (gen: number | "all") => void;
}

const MEDAL = ["🥇", "🥈", "🥉"];

// 世代排序：1..9 然後 all
function orderKey(k: string): number {
  return k === "all" ? 99 : Number(k);
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Records({ onBack, onReplay }: Props) {
  const [version, setVersion] = useState(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const records = useMemo<GenRecord[]>(() => {
    void version; // version 變動時重新讀取
    return Object.values(loadAll()).sort((a, b) => orderKey(a.genKey) - orderKey(b.genKey));
  }, [version]);

  const handleDownload = async (rec: GenRecord) => {
    if (savingKey) return;
    setSavingKey(rec.genKey);
    try {
      const blob = await drawShareCard(rec.top, rec.genLabel);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `命定寶可夢-${rec.genLabel}-${rec.top[0]?.name ?? "冠軍"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("產生分享圖失敗，請再試一次。");
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = (rec: GenRecord) => {
    if (confirm(`確定刪除「${rec.genLabel}」的紀錄嗎？`)) {
      deleteRecord(rec.genKey);
      setVersion((v) => v + 1);
    }
  };

  return (
    <div className="screen records">
      <div className="records-head">
        <button className="ghost" onClick={onBack}>
          ← 回首頁
        </button>
        <h1>我的紀錄</h1>
        <div style={{ width: 84 }} />
      </div>

      {records.length === 0 ? (
        <p className="records-empty">
          還沒有任何紀錄。
          <br />
          完成任一世代的對戰後，冠軍與前十名就會自動存在這台裝置上。
        </p>
      ) : (
        <div className="record-list">
          {records.map((rec) => {
            const champ = rec.top[0];
            return (
              <section className="record-card" key={rec.genKey}>
                <div className="record-card-head">
                  <div>
                    <strong className="record-gen">{rec.genLabel}</strong>
                    <span className="record-date">{fmtDate(rec.savedAt)}</span>
                  </div>
                  <button className="ghost del" onClick={() => handleDelete(rec)}>
                    🗑 刪除
                  </button>
                </div>

                <ol className="record-top">
                  {rec.top.map((m, i) => (
                    <li key={m.id} className={i === 0 ? "is-champ" : ""}>
                      <span className="rank-no">{MEDAL[i] ?? i + 1}</span>
                      <img src={m.img} alt={m.name} loading="lazy" />
                      <span className="rank-name">{m.name}</span>
                      <span className="rank-wins">{m.wins} 勝</span>
                    </li>
                  ))}
                </ol>

                <div className="record-actions">
                  <button
                    className="primary"
                    onClick={() => handleDownload(rec)}
                    disabled={savingKey === rec.genKey}
                  >
                    {savingKey === rec.genKey ? "產生中…" : "📸 下載分享圖"}
                  </button>
                  <button
                    className="ghost"
                    onClick={() => onReplay(rec.genKey === "all" ? "all" : Number(rec.genKey))}
                  >
                    重玩「{champ ? rec.genLabel : ""}」
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
