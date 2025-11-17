let outerMargin = 80;
let dataTable;
let volcanoes = [];
let filtered = [];

const FILTER_WIDTH = 260;

// 地图图像（本地 WebP）
let mapImg;
let mapURL = "assets/world.svg";

// 地图经纬度范围
let mapLeft = -180, mapRight = 180;
let mapTop = 90, mapBottom = -90;


// preload
function preload() {
  dataTable = loadTable("assets/data.csv", "csv", "header");
  mapImg = loadImage(mapURL);
}


// setup
function setup() {
  createCanvas(windowWidth, windowHeight);

  parseData();
  filtered = volcanoes;

  createFilterUI();
}


// 解析 CSV 数据
function parseData() {
  for (let r of dataTable.rows) {
    volcanoes.push({
      name: r.get("Name"),
      country: r.get("Country"),
      type: r.get("Type"),
      status: r.get("Status"),
      lat: parseFloat(r.get("Latitude")),
      lon: parseFloat(r.get("Longitude")),
      elev: parseFloat(r.get("Elevation"))
    });
  }
}


// 左侧过滤器 UI
function createFilterUI() {

  // 背景层
  let bg = createDiv("");
  bg.position(0, 0);
  bg.size(FILTER_WIDTH, windowHeight);
  bg.style("background", "#03071A");
  bg.style("z-index", "-1");

  // 标题
  let title = createDiv("FILTERS");
  title.position(20, 20);
  title.style("color", "#fff");
  title.style("font-size", "20px");

  // --- Country ---
  createSpan("Country").position(20, 80).style("color", "#ccc");
  filterCountry = createSelect();
  filterCountry.position(20, 105);
  filterCountry.style("width", "150px");  // ✔变窄
  filterCountry.option("All");

  let countries = [...new Set(volcanoes.map(v => v.country))].sort();
  countries.forEach(c => filterCountry.option(c));
  filterCountry.changed(applyFilters);

  // --- Type ---
  createSpan("Type").position(20, 160).style("color", "#ccc");
  filterType = createSelect();
  filterType.position(20, 185);
  filterType.style("width", "200px");
  filterType.option("All");

  let types = [...new Set(volcanoes.map(v => v.type))].sort();
  types.forEach(t => filterType.option(t));
  filterType.changed(applyFilters);

  // --- Status ---
  createSpan("Status").position(20, 240).style("color", "#ccc");
  filterStatus = createSelect();
  filterStatus.position(20, 265);
  filterStatus.style("width", "200px");
  filterStatus.option("All");

  let statuses = [...new Set(volcanoes.map(v => v.status))].sort();
  statuses.forEach(s => filterStatus.option(s));
  filterStatus.changed(applyFilters);
}


// 过滤逻辑
function applyFilters() {
  let c = filterCountry.value();
  let t = filterType.value();
  let s = filterStatus.value();

  filtered = volcanoes.filter(v => {
    return (c === "All" || v.country === c) &&
           (t === "All" || v.type === t) &&
           (s === "All" || v.status === s);
  });
}


// draw
function draw() {
  background("#050A1F");  // ✔深蓝背景

  let x = FILTER_WIDTH;
  let w = width - FILTER_WIDTH;
  let h = height;

  // 地图
  image(mapImg, x, 0, w, h);

  // 火山点
  drawVolcanoes(x, w, h);

  // 图例
  drawLegend();
}


// 绘制火山点
function drawVolcanoes(x, w, h) {
  noStroke();

  for (let v of filtered) {
    let px = map(v.lon, -180, 180, x, x + w);
    let py = map(v.lat, -90, 90, h, 0);

    fill(colorByType(v.type));
    ellipse(px, py, 6);   // ✔ 小点
  }
}


// =========================
// 图例
// =========================
function drawLegend() {
  let legendY = height - 36;
  let startX = FILTER_WIDTH + 40;

  let types = getTypePalette();

  textSize(12);
  textAlign(LEFT, CENTER);

  for (let i = 0; i < types.length; i++) {
    let x = startX + i * 150;

    fill(types[i].col);
    noStroke();
    ellipse(x, legendY, 10);

    fill(220);
    text(types[i].label, x + 16, legendY);
  }
}


// =========================
// 返回当前过滤后的类型颜色
// =========================
function getTypePalette() {
  let typeMap = new Map();
  for (let v of filtered) {
    if (!v.type) continue;
    if (!typeMap.has(v.type)) typeMap.set(v.type, colorByType(v.type));
  }
  return Array.from(typeMap.entries()).map(e => ({
    label: e[0],
    col: e[1]
  }));
}



function colorByType(type) {
  if (!type) return color("#AAB6C8");

  let t = type.toLowerCase();

  if (t.includes("strato"))       return color("#A6CDED"); // 淡蓝
  if (t.includes("shield"))       return color("#CD5A5C"); // 红
  if (t.includes("complex"))      return color("#F3C2B6"); // 粉
  if (t.includes("submarine"))    return color("#893F9A"); // 紫
  if (t.includes("lava"))         return color("#FCFDF9"); // 白

  return color("#AAB6C8"); // 默认灰
}


// =========================
// 自适应
// =========================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
