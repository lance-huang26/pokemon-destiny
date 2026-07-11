# 命定寶可夢 🎮

兩隻寶可夢中選一隻，用**單淘汰賽**選出你這輩子最命定的那一隻。可依「世代」進行（第 1～9 世代，或全國圖鑑 1025 隻），最後結算列出你的**最愛排行榜 TOP 10**。

**特色**

- 採 2 次方賽制：不足時第一輪為「初賽」補洞，之後每輪乾淨對半（初賽 → 64 強 → 32 強 → … → 準決賽 → 決賽）。
- 每輪切換時有 2.2 秒轉場動畫（「進入 64 強」）與號角音效。
- 標頭同時顯示「本輪第 X / Y 場」與「總場次 X / Y」。
- 選擇勝出有放大發光動畫 + 音效（可靜音）。
- 結算可**下載冠軍分享圖**（1080×1080 PNG，含亞／季軍）。

## 架構決策

- **純前端，無後端資料庫**：寶可夢資料（名字／世代／圖片）是唯讀且不變的靜態資料，一份 JSON（約 100KB）就足夠。可直接部署到 GitHub Pages / Vercel 等靜態託管，零伺服器成本。
- **資料來源：PokeAPI**。以一次性腳本從 PokeAPI 的 CSV 抓「繁體中文名字（zh-hant）」，配上世代（依國家圖鑑編號範圍）與官方立繪圖片 URL，產生 `src/data/pokemon.json`。App 執行時不再打任何 API。
- **圖片**：直接連 PokeAPI 官方立繪（GitHub 靜態託管），不佔專案空間。

## 開發

```bash
npm install
npm run dev          # 啟動開發伺服器
npm run build        # 型別檢查 + 打包
npm run test:logic   # 跑單淘汰賽引擎的邏輯測試
```

## 重新抓資料

名字／世代／圖片若要更新（例如未來新增世代），重跑：

```bash
npm run build:data   # 產生 src/data/pokemon.json
```

## 專案結構

```
src/
  data/pokemon.json        # 靜態資料：{ id, name, gen, img }
  tournament.ts            # 單淘汰賽引擎（純函式，可測試）
  sound.ts                 # Web Audio 合成音效（勝出／轉場／冠軍）
  shareCard.ts             # 冠軍分享圖（canvas 合成 PNG）
  App.tsx                  # 畫面狀態機：首頁 → 對戰 → 結算 + 轉場動畫
  components/
    GenSelect.tsx          # 世代選擇
    Battle.tsx             # 左右二選一對戰（勝出動畫、← / → 鍵、靜音）
    Result.tsx             # 冠軍 + TOP 10 + 下載分享圖
scripts/
  build-data.mjs           # 一次性資料建置
  test-tournament.ts       # 引擎邏輯測試
```

## 名次如何決定

單淘汰賽中，名次依「晉級輪數（勝場數）」由高到低排序：冠軍第一、決賽落敗者第二、準決賽落敗者並列第三⋯⋯依此類推取前 10 名。
