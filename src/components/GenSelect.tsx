import { useMemo } from "react";
import type { Mon } from "../tournament";
import type { GenRecord, RecordMap } from "../storage";

interface Props {
  data: Mon[];
  records: RecordMap;
  onStart: (gen: number | "all") => void;
  onOpenRecords: () => void;
}

const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 各世代對應的遊戲版本名
const GAME_NAMES: Record<number, string> = {
  1: "紅綠",
  2: "金銀",
  3: "紅藍寶石",
  4: "鑽石珍珠",
  5: "黑白",
  6: "XY",
  7: "日月",
  8: "劍盾",
  9: "朱紫",
};

// 已完成 → 前三名擺成頒獎台（冠軍置中放大）
function podium(rec: GenRecord): { src: string; alt: string }[] {
  const [c, s, t] = rec.top;
  return [s, c, t].filter(Boolean).map((m) => ({ src: m.img, alt: m.name }));
}

export default function GenSelect({ data, records, onStart, onOpenRecords }: Props) {
  const byGen = useMemo(() => {
    const map = new Map<number, Mon[]>();
    for (const m of data) {
      const arr = map.get(m.gen) ?? [];
      arr.push(m);
      map.set(m.gen, arr);
    }
    return map;
  }, [data]);

  const recordCount = Object.keys(records).length;

  const renderCard = (
    key: string,
    title: string,
    game: string | null,
    fallbackCount: string,
    fallbackSamples: { src: string; alt: string }[],
    rec: GenRecord | undefined,
    onClick: () => void,
    extraClass = "",
  ) => {
    const done = !!rec;
    const samples = done ? podium(rec!) : fallbackSamples;
    return (
      <button
        key={key}
        className={`gen-card${done ? " gen-card--done" : ""}${extraClass}`}
        onClick={onClick}
      >
        {done && (
          <span className="done-check" aria-label="已完成">
            ✓
          </span>
        )}
        <div className="gen-samples">
          {samples.map((s, i) => (
            <img key={i} src={s.src} alt={s.alt} loading="lazy" />
          ))}
        </div>
        <div className="gen-meta">
          <span className="gen-title">
            {title}
            {game && <span className="gen-game">{game}</span>}
          </span>
          {done ? (
            <span className="gen-done-info">✓ 這個世代已完成 · 做過 {rec!.plays} 次</span>
          ) : (
            <span className="gen-count">{fallbackCount}</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="screen home">
      <header className="home-head">
        <h1>命定寶可夢</h1>
        <p>兩隻中選一隻，單淘汰決出你這輩子最命定的那一隻。先挑一個世代開始。</p>
        {recordCount > 0 && (
          <button className="records-btn" onClick={onOpenRecords}>
            📖 我的紀錄（{recordCount} 個世代）
          </button>
        )}
      </header>

      <div className="gen-grid">
        {GENS.map((g) => {
          const list = byGen.get(g) ?? [];
          const samples = [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]]
            .filter(Boolean)
            .map((m) => ({ src: m.img, alt: m.name }));
          return renderCard(
            String(g),
            `第 ${g} 世代`,
            GAME_NAMES[g],
            `共 ${list.length} 隻`,
            samples,
            records[String(g)],
            () => onStart(g),
          );
        })}

        {renderCard(
          "all",
          "全國圖鑑",
          null,
          `全 ${data.length} 隻 · 終極挑戰`,
          [
            { src: data[24]?.img, alt: "" },
            { src: data[149]?.img, alt: "" },
            { src: data[data.length - 1]?.img, alt: "" },
          ],
          records["all"],
          () => onStart("all"),
          " gen-card--all",
        )}
      </div>
    </div>
  );
}
