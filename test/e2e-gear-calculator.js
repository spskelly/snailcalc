// End-to-end tests for the gear calculators, focused on the amulet migration
// (issue #41): legacy localStorage states migrate losslessly, dropdowns no
// longer offer amulets, and preset totals include amulet costs.
//
// Run: npm i puppeteer-core && node tests/e2e-gear-calculator.js
// Uses headless Edge; override the browser with EDGE_PATH if needed.
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };

let pass = 0, fail = 0;
function check(cond, msg, extra) {
  if (cond) pass++;
  else { fail++; console.log("FAIL: " + msg + (extra !== undefined ? " | " + JSON.stringify(extra) : "")); }
}

async function readCol(page, tableId, resource, colIndex) {
  return page.$eval("#" + tableId + " table", (t, res, ci) => {
    const row = [...t.querySelectorAll("tr")].find(r => r.querySelector("td") && r.querySelector("td").textContent.trim() === res);
    return Number([...row.querySelectorAll("td")][ci].textContent.replace(/,/g, ""));
  }, resource, colIndex);
}

(async () => {
  const puppeteer = (await import("puppeteer-core")).default;
  const srv = http.createServer((req, res) => {
    let p = req.url.split("?")[0]; if (p === "/") p = "/index.html";
    fs.readFile(path.join(ROOT, decodeURIComponent(p)), (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
      res.end(buf);
    });
  }).listen(8799);
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const URL = "http://localhost:8799/";

  // ===== Scenario 1: fresh user =====
  await page.goto(URL, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });

  const fresh = await page.evaluate(() => ({
    snailOpts: [...document.getElementById("snail1").options].map(o => o.value),
    minionOpts: [...document.getElementById("slot1").options].map(o => o.value),
    snailInputs: document.querySelectorAll("#snailAmuletQuantityGrid input").length,
    minionInputs: document.querySelectorAll("#minionAmuletQuantityGrid input").length,
  }));
  check(!fresh.snailOpts.some(o => o.startsWith("Amulet")), "snail dropdowns have no amulet options", fresh.snailOpts);
  check(!fresh.minionOpts.some(o => o.startsWith("Amulet")), "minion dropdowns have no amulet options", fresh.minionOpts);
  check(fresh.snailOpts.includes("Time Wanderer") && fresh.snailOpts.includes("+9"), "snail gear options intact");
  check(fresh.minionOpts.includes("+5"), "minion gear options intact");
  check(fresh.snailInputs === 9 && fresh.minionInputs === 5, "quantity inputs render (9 snail, 5 minion)", fresh);
  check(await readCol(page, "snailMainTable", "Crystal of Will", 1) === 0, "fresh user totals zero");

  // ===== Scenario 2: legacy user with amulets in slots and presets =====
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("snailGearSettings", JSON.stringify({ 1: "+3", 2: "Amulet +2", 3: "Amulet +2", 4: "Amulet (Red)" }));
    localStorage.setItem("minionGearSettings", JSON.stringify({ 1: "Amulet +4", 2: "+2" }));
    localStorage.setItem("snailPreset1", JSON.stringify({ 1: "Amulet +5", 2: "Red" }));
    localStorage.setItem("minionPreset2", JSON.stringify({ 1: "Amulet (Red)", 2: "Amulet (Red)" }));
    // user already had one +2 tracked as a quantity
    localStorage.setItem("snailAmuletQuantities", JSON.stringify({ "Amulet +2": 1 }));
  });
  await page.reload({ waitUntil: "load" });

  // slots: amulets gone, gear kept, selects show None (not blank)
  const slots = await page.evaluate(() => ({
    s1: document.getElementById("snail1").value,
    s2: document.getElementById("snail2").value,
    s4: document.getElementById("snail4").value,
    m1: document.getElementById("slot1").value,
    m2: document.getElementById("slot2").value,
  }));
  check(slots.s1 === "+3" && slots.m2 === "+2", "gear selections survive migration", slots);
  check(slots.s2 === "None" && slots.s4 === "None" && slots.m1 === "None", "amulet slots became None", slots);

  // quantities: 1 existing + 2 migrated = 3 for +2; Red = 1; minion +4 = 1
  const qty = await page.evaluate(() => ({
    p2: document.querySelector('#snailAmuletQuantityGrid input[aria-label="Amulet +2 quantity"]').value,
    red: document.querySelector('#snailAmuletQuantityGrid input[aria-label="Amulet (Red) quantity"]').value,
    m4: document.querySelector('#minionAmuletQuantityGrid input[aria-label="Amulet +4 quantity"]').value,
  }));
  check(qty.p2 === "3" && qty.red === "1" && qty.m4 === "1", "migrated quantities shown in inputs", qty);

  // parity: Current totals must equal old-style totals (gear + slot amulets + prior qty).
  // Crystal of Will: +3 gear = 3, 3x cum(+2) = 3, 1x cum(Red) = 1 -> 7 (hand-computed from data.js)
  check(await readCol(page, "snailMainTable", "Crystal of Will", 1) === 7, "snail Current CoW = 7 (parity with pre-migration)",
    await readCol(page, "snailMainTable", "Crystal of Will", 1));
  // Minion Demon God Crystal: +2 gear = 2 (via required amulets), 1x cum(+4) = 1 -> 3
  check(await readCol(page, "minionMainTable", "Demon God Crystal", 1) === 3, "minion Current DGC = 3 (parity)",
    await readCol(page, "minionMainTable", "Demon God Crystal", 1));

  // full-resource parity computed from the page's own cost tables
  const parity = await page.evaluate(() => {
    const w = WILL_AMULET_INCREMENTAL;
    const gear = calculateSnailCumulativeCost("+3");
    const a2 = calculateAmuletCumulativeCost("+2", w);
    const red = calculateAmuletCumulativeCost("Red", w);
    const expected = {};
    ["eoh", "orange", "abyss", "heaven", "glue", "b_tad", "will_crystal"].forEach(k => {
      expected[k] = (gear[k] || 0) + 3 * (a2[k] || 0) + (red[k] || 0);
    });
    return expected;
  });
  const rows = [["Eye of Horus", "eoh"], ["Orange", "orange"], ["Abyss Wing", "abyss"], ["Heaven Wing", "heaven"], ["Glue", "glue"], ["B-tad", "b_tad"], ["Crystal of Will", "will_crystal"]];
  for (const [label, key] of rows) {
    const got = await readCol(page, "snailMainTable", label, 1);
    check(got === parity[key], `snail parity: ${label}`, { expected: parity[key], got });
  }

  // issue #41 fixed: preset 1 column includes the migrated Amulet +5 cost (CoW = 1)
  check(await readCol(page, "snailMainTable", "Crystal of Will", 2) === 1, "#41 fixed: preset column counts migrated amulet",
    await readCol(page, "snailMainTable", "Crystal of Will", 2));
  check(await readCol(page, "minionMainTable", "Demon God Crystal", 3) === 2, "#41 fixed: minion preset 2 counts 2x Red",
    await readCol(page, "minionMainTable", "Demon God Crystal", 3));

  // storage: no amulet labels left anywhere in slot records
  const cleaned = await page.evaluate(() => {
    const keys = ["snailGearSettings", "minionGearSettings", "snailPreset1", "minionPreset2"];
    return keys.map(k => (localStorage.getItem(k) || "").includes("Amulet"));
  });
  check(cleaned.every(v => !v), "no amulet labels remain in slot records", cleaned);

  // idempotence: reload again, nothing changes
  await page.reload({ waitUntil: "load" });
  check(await readCol(page, "snailMainTable", "Crystal of Will", 1) === 7, "second reload: totals stable");
  check(await page.$eval('#snailAmuletQuantityGrid input[aria-label="Amulet +2 quantity"]', i => i.value) === "3", "second reload: quantities stable");

  // ===== Scenario 3: preset load restores migrated preset quantities =====
  await page.click("#loadSnailPreset1");
  const afterLoad = await page.evaluate(() => ({
    p5: document.querySelector('#snailAmuletQuantityGrid input[aria-label="Amulet +5 quantity"]').value,
    p2: document.querySelector('#snailAmuletQuantityGrid input[aria-label="Amulet +2 quantity"]').value,
    s2: document.getElementById("snail2").value,
  }));
  check(afterLoad.p5 === "1" && afterLoad.p2 === "0", "loading migrated preset restores its quantities", afterLoad);
  check(await readCol(page, "snailMainTable", "Crystal of Will", 1) === await readCol(page, "snailMainTable", "Crystal of Will", 2),
    "after preset load, Current equals preset column");

  // ===== Scenario 4: save/load round-trip post-migration =====
  await page.click('#snailAmuletQuantityGrid input[aria-label="Amulet +1 quantity"]', { clickCount: 3 });
  await page.type('#snailAmuletQuantityGrid input[aria-label="Amulet +1 quantity"]', "4");
  await page.click("#saveSnailPreset3");
  await page.click("#resetSnail");
  check(await readCol(page, "snailMainTable", "Crystal of Will", 1) === 0, "reset clears current");
  await page.click("#loadSnailPreset3");
  check(await page.$eval('#snailAmuletQuantityGrid input[aria-label="Amulet +1 quantity"]', i => i.value) === "4", "preset round-trip post-migration");

  check(errors.length === 0, "no console/page errors across all scenarios", errors);

  await browser.close();
  srv.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("HARNESS ERROR:", e); process.exit(2); });
