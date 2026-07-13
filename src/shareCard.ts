// 把前三名畫成一張可下載的分享圖（1080×1350 直式）。
// 圖片來源含 access-control-allow-origin: *，以 crossOrigin 載入即可匯出不被污染。

// 結構型別：Contestant 與 storage 的 SavedMon 都相容
export interface CardMon {
  name: string;
  dex: number;
  img: string;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // 載入失敗回 null，仍輸出其餘內容
    img.src = src;
  });
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  box: number,
) {
  const ratio = Math.min(box / img.width, box / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
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

const font = (size: number, weight = "700") =>
  `${weight} ${size}px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", system-ui, sans-serif`;

export async function drawShareCard(list: CardMon[], genLabel: string): Promise<Blob> {
  const [champ, second, third] = list;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立畫布");

  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1c1d40");
  bg.addColorStop(1, "#0d0e1e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 440, 40, W / 2, 440, 460);
  glow.addColorStop(0, "rgba(255,203,5,0.28)");
  glow.addColorStop(1, "rgba(255,203,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // 標題
  ctx.fillStyle = "#ffcb05";
  ctx.font = font(58, "800");
  ctx.fillText("命定寶可夢", W / 2, 118);
  ctx.fillStyle = "#a3a4c2";
  ctx.font = font(32, "500");
  ctx.fillText(`${genLabel}　我的命定寶可夢`, W / 2, 176);

  // 先把三張圖都載入
  const [imgC, img2, img3] = await Promise.all([
    loadImg(champ.img),
    second ? loadImg(second.img) : Promise.resolve(null),
    third ? loadImg(third.img) : Promise.resolve(null),
  ]);

  // 冠軍立繪
  if (imgC) drawContain(ctx, imgC, W / 2, 445, 430);
  ctx.fillStyle = "#ffffff";
  ctx.font = font(82, "900");
  ctx.fillText(`👑 ${champ.name}`, W / 2, 730);
  ctx.fillStyle = "#a3a4c2";
  ctx.font = font(34, "500");
  ctx.fillText(`No.${String(champ.dex).padStart(4, "0")}`, W / 2, 782);

  // 亞軍 / 季軍：立繪 + 名字
  const podium: { mon: CardMon; img: HTMLImageElement | null; medal: string; cx: number }[] = [];
  if (second) podium.push({ mon: second, img: img2, medal: "🥈", cx: W / 2 - 250 });
  if (third) podium.push({ mon: third, img: img3, medal: "🥉", cx: W / 2 + 250 });

  if (podium.length) {
    // 分隔線
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 858);
    ctx.lineTo(W - 140, 858);
    ctx.stroke();

    for (const p of podium) {
      if (p.img) drawContain(ctx, p.img, p.cx, 1000, 220);
      ctx.fillStyle = "#ffffff";
      ctx.font = font(40, "800");
      ctx.fillText(`${p.medal} ${p.mon.name}`, p.cx, 1170);
      ctx.fillStyle = "#a3a4c2";
      ctx.font = font(28, "500");
      ctx.fillText(`No.${String(p.mon.dex).padStart(4, "0")}`, p.cx, 1210);
    }
  }

  // 頁尾標籤
  roundRect(ctx, W / 2 - 200, 1268, 400, 54, 27);
  ctx.fillStyle = "rgba(255,203,5,0.16)";
  ctx.fill();
  ctx.fillStyle = "#ffcb05";
  ctx.font = font(28, "600");
  ctx.fillText("single-elimination · 單淘汰選出", W / 2, 1303);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("匯出失敗"))), "image/png");
  });
}
