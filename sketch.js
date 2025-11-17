let outerMargin = 80;
let data;
let volcanoes = [];
let filtered = [];

const FILTER_WIDTH = 260;

// 地图图片
let mapImg;
let mapURL = "assets/world.svg";

// 经纬度范围
let minLon, maxLon, minLat, maxLat, minElev, maxElev;

// 过滤器
let filterCountry, filterType, filterStatus;

function preload() {
  data = loadTable("assets/data.csv", "csv", "header");
  mapImg = loadImage(mapURL);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  parseData();
  filtered = volcanoes;

  createFilterUI();
}

// 解析 CSV 数据
function parseData() {
  let allLon = [], allLat = [], allElev = [];
  for (let r of data.rows) {
    let lat = parseFloat(r.get("Latitude"));
    let lon = parseFloat(r.get("Longitude"));
    let elev = parseFloat(r.get("Elevation (m)"));
    if (isNaN(lat) || isNaN(lon)) continue;

    allLon.push(lon);
    allLat.push(lat);
    if (!isNaN(elev)) allElev.push(elev);

    volcanoes.push({
      name: r.get("Volcano Name"),
      country: r.get("Country"),
      type: r.get("TypeCategory"),
      status: r.get("Status"),
      lat, lon, elev: elev,
      x: 0, y: 0, radius: 0, color: colorByType(r.get("TypeCategory"))
    });
  }

  minLon = Math.min(...allLon);
  maxLon = Math.max(...allLon);
  minLat = Math.min(...allLat);
  maxLat = Math.max(...allLat);
  minElev = allElev.length > 0 ? Math.min(...allElev) : 0;
  maxElev = allElev.length > 0 ? Math.max(...allElev) : 8000;

  // 映射 x, y, radius
  for (let v of volcanoes) {
    v.x = map(v.lon, minLon, maxLon, FILTER_WIDTH + outerMargin, width - outerMargin);
    v.y = map(v.lat, minLat, maxLat, height - outerMargin, outerMargin);
    v.radius = v.elev ? map(v.elev, minElev, maxElev, 3, 15) : 5;
  }
}

// 创建左侧过滤器
function createFilterUI() {
  // 背景
  let bg = createDiv("");
  bg.position(0, 0);
  bg.size(FILTER_WIDTH, windowHeight);
  bg.style("background", "#03071A");
  bg.style("z-index", "-1");

  let yPos = 30;

  // 标题
  let title = createDiv("FILTERS");
  title.position(20, yPos);
  title.style("color", "#fff");
  title.style("font-size", "20px");
  yPos += 40;

  // 国家过滤器
  createSpan("Country").position(20, yPos).style("color", "#ccc");
  yPos += 25;
  filterCountry = createSelect();
  filterCountry.position(20, yPos);
  filterCountry.style("width", "200px");
  filterCountry.option("All");
  [...new Set(volcanoes.map(v => v.country))].sort().forEach(c => filterCountry.option(c));
  filterCountry.changed(applyFilters);
  yPos += 50;

  // 类型过滤器
  createSpan("Type").position(20, yPos).style("color", "#ccc");
  yPos += 25;
  filterType = createSelect();
  filterType.position(20, yPos);
  filterType.style("width", "200px");
  filterType.option("All");
  [...new Set(volcanoes.map(v => v.type))].sort().forEach(t => filterType.option(t));
  filterType.changed(applyFilters);
  yPos += 50;

  // 状态过滤器
  createSpan("Status").position(20, yPos).style("color", "#ccc");
  yPos += 25;
  filterStatus = createSelect();
  filterStatus.position(20, yPos);
  filterStatus.style("width", "200px");
  filterStatus.option("All");
  [...new Set(volcanoes.map(v => v.status))].sort().forEach(s => filterStatus.option(s));
  filterStatus.changed(applyFilters);
}

// 应用过滤器
function applyFilters() {
  let c = filterCountry.value();
  let t = filterType.value();
  let s = filterStatus.value();

  filtered = volcanoes.filter(v =>
    (c === "All" || v.country === c) &&
    (t === "All" || v.type === t) &&
    (s === "All" || v.status === s)
  );
}

// draw
function draw() {
  background("#050A1F");

  // 绘制地图
  image(mapImg, FILTER_WIDTH, 0, width - FILTER_WIDTH, height);

  // 绘制火山
  let hovered = null;
  for (let v of filtered) {
    let d = dist(mouseX, mouseY, v.x, v.y);
    let highlight = d < Math.max(4, v.radius);
    drawVolcano(v.x, v.y, v.radius, v.color, highlight);
    if (highlight) hovered = v;
  }

  // tooltip + 经纬度
  if (hovered) {
    cursor("pointer");
    drawTooltip(hovered.x + 10, hovered.y - 30,
      `${hovered.name}\n${hovered.type}\n${hovered.country}\n${hovered.elev ? Math.round(hovered.elev) + " m" : "N/A"}`
    );
    textAlign(RIGHT, BOTTOM);
    fill(255);
    textSize(14);
    text(`Lon: ${hovered.lon}°, Lat: ${hovered.lat}°`, width - 20, height - 10);
  } else cursor("default");

  // 标题
  fill(255);
  textSize(24);
  textAlign(CENTER, TOP);
  text("🌋 Volcano Dataset — Map + Glyph", width / 2, 20);

  // 图例
  drawLegend();
}

// 绘制单个火山
function drawVolcano(x, y, radius, c, highlight) {
  noStroke();
  fill(c);
  ellipse(x, y, radius);
  if (highlight) {
    stroke(255);
    strokeWeight(2);
    noFill();
    ellipse(x, y, radius + 6);
    noStroke();
  }
}

// tooltip
function drawTooltip(px, py, txt) {
  push();
  textAlign(LEFT, TOP);
  textSize(13);
  let lines = txt.split("\n");
  let w = 180, h = lines.length * 18 + 8;
  fill(10, 10, 10, 230);
  noStroke();
  rect(px, py, w, h, 6);
  fill(255);
  for (let i = 0; i < lines.length; i++) text(lines[i], px + 8, py + 5 + i * 18);
  pop();
}

// 图例
function drawLegend() {
  let legendY = height - 36;
  let startX = FILTER_WIDTH + 40;
  let types = [
    ["Stratovolcano", color("#A6CDED")],
    ["Shield", color("#CD5A5C")],
    ["Complex", color("#F3C2B6")],
    ["Submarine", color("#893F9A")],
    ["Lava Dome", color("#FCFDF9")],
    ["Other", color("#ADD5C4")]
  ];
  textSize(12);
  textAlign(LEFT, CENTER);
  for (let i = 0; i < types.length; i++) {
    let x = startX + i * 140;
    fill(types[i][1]);
    noStroke();
    ellipse(x, legendY, 10);
    fill(220);
    text(types[i][0], x + 16, legendY);
  }
}

function colorByType(type) {
  if (!type) return color("#ADD5C4");
  let t = type.toLowerCase();
  if (t.includes("strato")) return color("#A6CDED");
  if (t.includes("shield")) return color("#CD5A5C");
  if (t.includes("complex")) return color("#F3C2B6");
  if (t.includes("submarine")) return color("#893F9A");
  if (t.includes("lava")) return color("#FCFDF9");
  return color("#ADD5C4");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  parseData();
  applyFilters();
}
