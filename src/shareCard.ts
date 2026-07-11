// 把冠軍畫成一張可下載的分享圖（1080×1080）。
// 圖片來源含 access-control-allow-origin: *，以 crossOrigin 載入即可匯出不被污染。
import type { Contestant } from "./tournament";

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function drawShareCard(ranking: Contestant[], genLabel: string): Promise<Blob> {
  const champ = ranking[0];
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立畫布");

  // 背景
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#1c1d40");
  bg.addColorStop(1, "#0d0e1e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  // 冠軍後方光暈
  const glow = ctx.createRadialGradient(S / 2, 470, 40, S / 2, 470, 420);
  glow.addColorStop(0, "rgba(255,203,5,0.28)");
  glow.addColorStop(1, "rgba(255,203,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const font = (size: number, weight = "700") =>
    `${weight} ${size}px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", system-ui, sans-serif`;

  // 標題
  ctx.fillStyle = "#ffcb05";
  ctx.font = font(58, "800");
  ctx.fillText("命定寶可夢", S / 2, 130);
  ctx.fillStyle = "#a3a4c2";
  ctx.font = font(32, "500");
  ctx.fillText(`${genLabel}　我的命定寶可夢`, S / 2, 190);

  // 冠軍立繪
  try {
    const img = await loadImg(champ.img);
    const box = 460;
    const by = 240;
    const ratio = Math.min(box / img.width, box / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, S / 2 - w / 2, by + (box - h) / 2, w, h);
  } catch {
    // 圖片載入失敗就略過，仍輸出文字卡
  }

  // 皇冠 + 名字
  ctx.fillStyle = "#ffffff";
  ctx.font = font(82, "900");
  ctx.fillText(`👑 ${champ.name}`, S / 2, 810);
  ctx.fillStyle = "#a3a4c2";
  ctx.font = font(34, "500");
  ctx.fillText(`No.${String(champ.dex).padStart(4, "0")}`, S / 2, 865);

  // 亞軍 / 季軍
  const runners = [ranking[1], ranking[2]].filter(Boolean);
  if (runners.length) {
    const line = runners
      .map((m, i) => `${i === 0 ? "🥈 亞軍" : "🥉 季軍"} ${m.name}`)
      .join("　　");
    ctx.fillStyle = "#d7d8ee";
    ctx.font = font(36, "600");
    ctx.fillText(line, S / 2, 960);
  }

  // 頁尾標籤
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = font(28, "600");
  roundRect(ctx, S / 2 - 190, 1000, 380, 52, 26);
  ctx.fillStyle = "rgba(255,203,5,0.16)";
  ctx.fill();
  ctx.fillStyle = "#ffcb05";
  ctx.fillText("single-elimination · 單淘汰選出", S / 2, 1034);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("匯出失敗"));
    }, "image/png");
  });
}
