import { useMemo } from "react";
import type { Mon } from "../tournament";

interface Props {
  data: Mon[];
  onStart: (gen: number | "all") => void;
}

const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function GenSelect({ data, onStart }: Props) {
  const byGen = useMemo(() => {
    const map = new Map<number, Mon[]>();
    for (const m of data) {
      const arr = map.get(m.gen) ?? [];
      arr.push(m);
      map.set(m.gen, arr);
    }
    return map;
  }, [data]);

  return (
    <div className="screen home">
      <header className="home-head">
        <h1>命定寶可夢</h1>
        <p>兩隻中選一隻，單淘汰決出你這輩子最命定的那一隻。先挑一個世代開始。</p>
      </header>

      <div className="gen-grid">
        {GENS.map((g) => {
          const list = byGen.get(g) ?? [];
          const samples = [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]].filter(
            Boolean,
          );
          return (
            <button key={g} className="gen-card" onClick={() => onStart(g)}>
              <div className="gen-samples">
                {samples.map((m) => (
                  <img key={m.id} src={m.img} alt={m.name} loading="lazy" />
                ))}
              </div>
              <div className="gen-meta">
                <span className="gen-title">第 {g} 世代</span>
                <span className="gen-count">共 {list.length} 隻</span>
              </div>
            </button>
          );
        })}

        <button className="gen-card gen-card--all" onClick={() => onStart("all")}>
          <div className="gen-samples">
            <img src={data[24]?.img} alt="" loading="lazy" />
            <img src={data[149]?.img} alt="" loading="lazy" />
            <img src={data[data.length - 1]?.img} alt="" loading="lazy" />
          </div>
          <div className="gen-meta">
            <span className="gen-title">全國圖鑑</span>
            <span className="gen-count">全 {data.length} 隻 · 終極挑戰</span>
          </div>
        </button>
      </div>
    </div>
  );
}
