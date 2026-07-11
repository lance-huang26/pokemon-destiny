// 一次性資料建置腳本：從 PokeAPI 的 CSV 抓繁中名字，配上世代與官方立繪圖片 URL。
// 一般寶可夢 + 第七世代起的「地區型態」(阿羅拉/伽勒爾/洗翠/帕底亞)。
// 執行：node scripts/build-data.mjs  （會產生 src/data/pokemon.json）
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ZH_HANT = 4; // PokeAPI 語言表：zh-hant = 4
const BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const SPECIES_NAMES_CSV = `${BASE}/pokemon_species_names.csv`;
const FORMS_CSV = `${BASE}/pokemon_forms.csv`;
const POKEMON_CSV = `${BASE}/pokemon.csv`;

// 官方立繪（GitHub 靜態託管，穩定可外連）；地區型態用 form 的 pokemon id
const artwork = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// 各世代的國家圖鑑編號範圍
const GEN_RANGES = [
  [1, 1, 151],
  [2, 152, 251],
  [3, 252, 386],
  [4, 387, 493],
  [5, 494, 649],
  [6, 650, 721],
  [7, 722, 809],
  [8, 810, 905],
  [9, 906, 1025],
];
const genOf = (id) => {
  for (const [gen, lo, hi] of GEN_RANGES) if (id >= lo && id <= hi) return gen;
  return null;
};

// 地區型態：前綴與其登場世代（官方繁中譯名）
const REGION = {
  alola: { prefix: "阿羅拉", gen: 7 },
  galar: { prefix: "伽勒爾", gen: 8 },
  hisui: { prefix: "洗翠", gen: 8 },
  paldea: { prefix: "帕底亞", gen: 9 },
};
// 帕底亞肯泰羅三種鬥牛型態的區別後綴
const SUFFIX = {
  "paldea-combat-breed": "（鬥戰種）",
  "paldea-blaze-breed": "（火熾種）",
  "paldea-aqua-breed": "（水生種）",
};

async function getCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下載失敗 ${res.status}: ${url}`);
  const text = await res.text();
  return text.trim().split("\n").slice(1); // 去表頭
}

console.log("下載 CSV …");
const [speciesLines, formLines, pokemonLines] = await Promise.all([
  getCsv(SPECIES_NAMES_CSV),
  getCsv(FORMS_CSV),
  getCsv(POKEMON_CSV),
]);

// 繁中物種名：speciesId -> name（繁中名字不含逗號，取前三欄即可）
const speciesName = new Map();
for (const line of speciesLines) {
  const p = line.split(",");
  if (Number(p[1]) === ZH_HANT) speciesName.set(Number(p[0]), p[2].trim());
}

// pokemon.csv：pokemonId -> speciesId
const speciesOf = new Map();
for (const line of pokemonLines) {
  const p = line.split(",");
  speciesOf.set(Number(p[0]), Number(p[2]));
}

const list = [];

// 一般寶可夢（全國圖鑑 1~1025）
for (const [id, name] of speciesName) {
  const gen = genOf(id);
  if (!gen) continue;
  list.push({ id, dex: id, name, gen, img: artwork(id) });
}

// 地區型態
const regionKeys = Object.keys(REGION);
let formCount = 0;
for (const line of formLines) {
  // id, identifier, form_identifier, pokemon_id, introduced_in_version_group_id, is_default, is_battle_only, is_mega, ...
  const p = line.split(",");
  const formIdentifier = p[2];
  const pokemonId = Number(p[3]);
  const isBattleOnly = p[6] === "1";

  const region = regionKeys.find(
    (k) => formIdentifier === k || formIdentifier.startsWith(k + "-"),
  );
  if (!region) continue;
  if (isBattleOnly) continue; // 例如伽勒爾達摩狒狒的達摩模式
  if (formIdentifier.includes("cap")) continue; // 阿羅拉帽皮卡丘不是地區型態

  const speciesId = speciesOf.get(pokemonId);
  const base = speciesName.get(speciesId);
  if (!base) continue;

  const name = REGION[region].prefix + base + (SUFFIX[formIdentifier] ?? "");
  list.push({
    id: pokemonId,
    dex: speciesId,
    name,
    gen: REGION[region].gen,
    img: artwork(pokemonId),
  });
  formCount++;
}

// 依 世代 → 圖鑑編號 → id 排序
list.sort((a, b) => a.gen - b.gen || a.dex - b.dex || a.id - b.id);

const outDir = resolve(__dirname, "../src/data");
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "pokemon.json"), JSON.stringify(list, null, 0));

const byGen = {};
for (const p of list) byGen[p.gen] = (byGen[p.gen] || 0) + 1;
console.log(`完成：共 ${list.length} 隻（含 ${formCount} 個地區型態）`);
console.log("各世代數量：", byGen);
