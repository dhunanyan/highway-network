const mTick = document.getElementById("mTick");
const mActive = document.getElementById("mActive");
const mCompleted = document.getElementById("mCompleted");
const mRevenue = document.getElementById("mRevenue");
const entries = document.getElementById("entries");
const exits = document.getElementById("exits");
const trips = document.getElementById("trips");
const statusEl = document.getElementById("status");
const trafficMap = document.getElementById("trafficMap");
const alertsEl = document.getElementById("alerts");
const networkTitle = document.getElementById("networkTitle");
const badgeRoads = document.getElementById("badgeRoads");
const badgeCameras = document.getElementById("badgeCameras");
const badgeFleet = document.getElementById("badgeFleet");
const spotlight = document.getElementById("spotlight");
const roadHealth = document.getElementById("roadHealth");
const cameraWatch = document.getElementById("cameraWatch");
const revenueMix = document.getElementById("revenueMix");
const fleetIntel = document.getElementById("fleetIntel");
const overviewBoard = document.getElementById("overviewBoard");
const riskBoard = document.getElementById("riskBoard");
const fleetBoard = document.getElementById("fleetBoard");
const tabButtons = [...document.querySelectorAll(".tab-btn")];

const btnTick1 = document.getElementById("tick1");
const btnTick5 = document.getElementById("tick5");
const btnTick20 = document.getElementById("tick20");
const btnAuto = document.getElementById("auto");
const btnReset = document.getElementById("reset");

let autoTimer = null;
let pollTimer = null;

const ROAD_CONNECTIONS = [
  ["A1", "A2"],
  ["A1", "A4"],
  ["A4", "A8"],
  ["A4", "A18"],
  ["A2", "A50"]
];

const ROAD_POSITIONS = {
  A1: { x: 390, y: 90 },
  A2: { x: 560, y: 120 },
  A4: { x: 700, y: 190 },
  A8: { x: 900, y: 150 },
  A18: { x: 860, y: 280 },
  A6: { x: 250, y: 280 },
  A50: { x: 560, y: 300 }
};

function icon(name, extraClass = "") {
  const cls = extraClass ? `icon ${extraClass}` : "icon";
  const icons = {
    roads: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M8 3h8l-1 6h2l-1.2 6H18l-1 6h-2l1-6h-4l-1 6H9l1-6H7.2L8.4 9H10L8 3Zm3 12h4l.6-3h-4Z" fill="currentColor"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M9 5 7.5 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.5L15 5H9Zm3 4.2A3.8 3.8 0 1 1 8.2 13 3.8 3.8 0 0 1 12 9.2Z" fill="currentColor"/></svg>`,
    car: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M7 5h10l2.3 5H21a1 1 0 0 1 1 1v5h-2a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H2v-5a1 1 0 0 1 1-1h1.7L7 5Zm1.3 2L6.9 10h10.2L15.7 7Z" fill="currentColor"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 4 2.7 20h18.6L12 4Zm1 5v5h-2V9h2Zm0 8v2h-2v-2h2Z" fill="currentColor"/></svg>`,
    entry: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M13 5v4h6v6h-6v4l-8-7 8-7Z" fill="currentColor"/></svg>`,
    exit: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M11 5v4H5v6h6v4l8-7-8-7Z" fill="currentColor"/></svg>`,
    revenue: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 3a7 7 0 0 1 7 7c0 4.4-3.6 7-7 7a3 3 0 1 0 3 3h2a5 5 0 1 1-5-5c2.6 0 5-1.8 5-5a5 5 0 1 0-10 0H5a7 7 0 0 1 7-7Z" fill="currentColor"/></svg>`,
    speed: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 5a9 9 0 1 0 9 9A9 9 0 0 0 12 5Zm0 2a7 7 0 0 1 6.8 5.5H17a5.3 5.3 0 0 0-10 0H5.2A7 7 0 0 1 12 7Zm-1 7 5-3-3 5a1.5 1.5 0 1 1-2-2Z" fill="currentColor"/></svg>`,
    factory: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M3 20V8l6 3V8l6 3V4l6 3v13H3Zm3-2h2v-3H6v3Zm4 0h2v-3h-2v3Zm4 0h2v-3h-2v3Z" fill="currentColor"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18h1.2a2.8 2.8 0 0 0 0-5.6H11a1.5 1.5 0 0 1 0-3h2a4 4 0 0 0 0-8H12Zm-4 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor"/></svg>`,
    density: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M5 17h3v2H5v-2Zm5-6h3v8h-3v-8Zm5-4h3v12h-3V7Z" fill="currentColor"/></svg>`
  };
  return icons[name] || "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tollColor(toll) {
  if (toll < 80) return "#34d399";
  if (toll <= 160) return "#f59e0b";
  return "#ef4444";
}

function estimatedSpeed(t) {
  const totalTicks = Math.max(1, Number(t.totalTicks || 1));
  const elapsedTicks = Math.max(1, totalTicks - Number(t.ticksLeft || 0));
  const hours = (elapsedTicks * 30.0) / 3600.0;
  const progressedKm = Number(t.distanceKm || 0) * (elapsedTicks / totalTicks);
  if (hours <= 0) return 0;
  return progressedKm / hours;
}

function roadStats(state) {
  const stats = {};
  state.activeTrips.forEach((t) => {
    if (!stats[t.road]) {
      stats[t.road] = { active: 0, revenue: 0, avgSpeed: 0, warnings: 0, samples: 0 };
    }
    stats[t.road].active += 1;
    stats[t.road].revenue += Number(t.toll || 0);
    stats[t.road].avgSpeed += estimatedSpeed(t);
    stats[t.road].samples += 1;
  });
  (state.alerts || []).forEach((a) => {
    const road = String(a.route || "").split(":")[0];
    if (!stats[road]) {
      stats[road] = { active: 0, revenue: 0, avgSpeed: 0, warnings: 0, samples: 0 };
    }
    stats[road].warnings += 1;
  });
  Object.values(stats).forEach((s) => {
    if (s.samples > 0) s.avgSpeed /= s.samples;
  });
  return stats;
}

function setActiveTab(tabId) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
}

function hydrateStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const markup = icon(el.dataset.icon || "");
    if (markup) el.innerHTML = markup;
  });
}

function roadSet(state) {
  const set = new Set();
  state.entries.forEach((e) => set.add(e.road));
  state.exits.forEach((e) => set.add(e.road));
  return [...set];
}

function connectedRoads(roads) {
  const connected = new Set();
  ROAD_CONNECTIONS.forEach(([a, b]) => {
    if (roads.includes(a) && roads.includes(b)) {
      connected.add(a);
      connected.add(b);
    }
  });
  return connected;
}

function buildGateNodes(state) {
  const nodes = {};
  const grouped = {};
  const place = (g, type) => {
    if (!grouped[g.road]) grouped[g.road] = { entry: [], exit: [] };
    grouped[g.road][type].push(g);
  };

  state.entries.forEach((g) => place(g, "entry"));
  state.exits.forEach((g) => place(g, "exit"));

  Object.keys(grouped).forEach((road) => {
    const center = ROAD_POSITIONS[road] || { x: 600, y: 180 };
    const entryList = grouped[road].entry;
    const exitList = grouped[road].exit;

    entryList.forEach((g, i) => {
      nodes[g.id] = {
        x: center.x - 120,
        y: center.y - 40 + i * 22,
        gate: g,
        type: "entry"
      };
    });

    exitList.forEach((g, i) => {
      nodes[g.id] = {
        x: center.x + 120,
        y: center.y - 40 + i * 22,
        gate: g,
        type: "exit"
      };
    });
  });

  return nodes;
}

function drawRoadGraphBase(state) {
  const roads = roadSet(state);
  const connected = connectedRoads(roads);

  let svg = `
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2b3350" stroke-width="1" opacity="0.5"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="1200" height="420" fill="url(#bgGrad)" />
    <rect x="0" y="0" width="1200" height="420" fill="url(#grid)" />
  `;

  ROAD_CONNECTIONS.forEach(([a, b]) => {
    if (!roads.includes(a) || !roads.includes(b)) return;
    const pa = ROAD_POSITIONS[a];
    const pb = ROAD_POSITIONS[b];
    svg += `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="#e5e7eb" stroke-width="2.2" opacity="0.9"/>`;
  });

  roads.forEach((r) => {
    const p = ROAD_POSITIONS[r] || { x: 600, y: 180 };
    const isConnected = connected.has(r);
    const fill = isConnected ? "#1d4ed8" : "#7c3aed";
    const stroke = isConnected ? "#60a5fa" : "#c4b5fd";
    svg += `
      <circle cx="${p.x}" cy="${p.y}" r="28" fill="${fill}" stroke="${stroke}" stroke-width="3" />
      <text x="${p.x}" y="${p.y + 6}" fill="#eef2ff" font-size="16" font-weight="700" text-anchor="middle">${escapeHtml(r)}</text>
    `;
  });

  return svg;
}

function renderTrafficMap(state) {
  if (!state || state.error) {
    trafficMap.innerHTML = "";
    return;
  }

  const gateNodes = buildGateNodes(state);
  let svg = drawRoadGraphBase(state);

  state.entries.forEach((g) => {
    const n = gateNodes[g.id];
    if (!n) return;
    svg += `
      <circle cx="${n.x}" cy="${n.y}" r="10" fill="#22c55e" stroke="#bbf7d0" stroke-width="2" />
      <text x="${n.x - 16}" y="${n.y - 14}" fill="#dbeafe" font-size="11" text-anchor="end">${escapeHtml(g.id)}</text>
    `;
  });

  state.exits.forEach((g) => {
    const n = gateNodes[g.id];
    if (!n) return;
    svg += `
      <circle cx="${n.x}" cy="${n.y}" r="10" fill="#f97316" stroke="#fed7aa" stroke-width="2" />
      <text x="${n.x + 16}" y="${n.y - 14}" fill="#dbeafe" font-size="11" text-anchor="start">${escapeHtml(g.id)}</text>
    `;
  });

  state.activeTrips.forEach((t, idx) => {
    const start = gateNodes[t.entryId];
    const end = gateNodes[t.exitId];
    const hub = ROAD_POSITIONS[t.road] || { x: 600, y: 180 };
    if (!start || !end) return;

    const totalTicks = Math.max(1, Number(t.totalTicks || 1));
    const progress = Math.max(0, Math.min(1, 1 - t.ticksLeft / totalTicks));

    let vx;
    let vy;
    if (progress < 0.5) {
      const p = progress * 2;
      vx = start.x + (hub.x - start.x) * p;
      vy = start.y + (hub.y - start.y) * p;
    } else {
      const p = (progress - 0.5) * 2;
      vx = hub.x + (end.x - hub.x) * p;
      vy = hub.y + (end.y - hub.y) * p;
    }

    const color = tollColor(Number(t.toll || 0));
    const jitter = ((idx % 5) - 2) * 3;

    svg += `
      <path d="M ${start.x} ${start.y} L ${hub.x} ${hub.y} L ${end.x} ${end.y}" stroke="${color}" stroke-width="2" fill="none" stroke-dasharray="5 6" opacity="0.9" />
      <circle cx="${vx + jitter}" cy="${vy - jitter}" r="6.5" fill="${color}">
        <animate attributeName="r" values="6.2;7.8;6.2" dur="1.4s" repeatCount="indefinite" />
      </circle>
    `;
  });

  if (!state.activeTrips.length) {
    svg += `<text x="600" y="210" fill="#cbd5e1" font-size="14" text-anchor="middle">No active cars on the network</text>`;
  }

  trafficMap.innerHTML = svg;
}

function renderAlerts(state) {
  const alerts = Array.isArray(state?.alerts) ? state.alerts : [];
  alertsEl.innerHTML = "";

  if (!alerts.length) {
    alertsEl.innerHTML = '<div class="small">No suspicious behavior warnings.</div>';
    return;
  }

  alerts
    .slice()
    .reverse()
    .forEach((a) => {
      const item = document.createElement("div");
      item.className = "alert-item";
      item.innerHTML = `
        <span class="alert-icon">${icon("warning")}</span>
        <span>
          <strong>${escapeHtml(a.type || "warning")}</strong> [t=${a.tick}] ${escapeHtml(a.message)}<br/>
          Car: ${escapeHtml(a.vehicleA || "n/a")} · ${escapeHtml(a.make || "?")} ${escapeHtml(a.model || "?")} · ${escapeHtml(a.color || "?")}<br/>
          Camera: ${escapeHtml(a.cameraId || "CAM-UNKNOWN")} · Speed: ${Number(a.measuredSpeedKmh || 0).toFixed(1)} km/h / Limit ${Number(a.speedLimitKmh || 0).toFixed(0)} km/h · Route ${escapeHtml(a.route || "")}
        </span>
      `;
      alertsEl.appendChild(item);
    });
}

function renderHero(state) {
  const roads = roadSet(state);
  networkTitle.textContent = `${state.networkName || "Poland Highway Monitoring Grid"}`;
  badgeRoads.textContent = `${roads.length} roads`;
  badgeCameras.textContent = `${state.entries.length + state.exits.length} cameras`;
  badgeFleet.textContent = `${state.activeTripCount} active`;

  const topAlert = (state.alerts || []).slice().reverse()[0];
  if (topAlert) {
    spotlight.innerHTML = `
      <div class="eyebrow">Priority Warning</div>
      <div><strong>${escapeHtml(topAlert.type || "warning")}</strong> detected on <strong>${escapeHtml(topAlert.route || "unknown route")}</strong>.</div>
      <div class="small">Vehicle ${escapeHtml(topAlert.vehicleA || "n/a")} · ${escapeHtml(topAlert.make || "?")} ${escapeHtml(topAlert.model || "?")} · Camera ${escapeHtml(topAlert.cameraId || "CAM-UNKNOWN")}</div>
    `;
  } else {
    spotlight.innerHTML = `
      <div class="eyebrow">Network Status</div>
      <div><strong>Stable flow.</strong> No suspicious driving events currently flagged by motorway cameras.</div>
      <div class="small">The console is tracking toll flow, camera identity, route occupancy, and suspicious travel patterns.</div>
    `;
  }
}

function renderRoadHealth(state) {
  const stats = roadStats(state);
  const roads = roadSet(state).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  roadHealth.innerHTML = "";

  roads.forEach((road) => {
    const s = stats[road] || { active: 0, revenue: 0, avgSpeed: 0, warnings: 0 };
    const badgeClass = s.warnings > 3 ? "bad" : s.warnings > 0 ? "warn" : "good";
    const badgeText = s.warnings > 3 ? "Hot" : s.warnings > 0 ? "Watch" : "Stable";
    const div = document.createElement("div");
    div.className = "road-card";
    div.innerHTML = `
      <div class="road-top">
        <div class="road-code">${icon("roads", "icon-sm")}<span>${road}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="road-metrics">
        <span>${icon("car", "icon-xs")} ${s.active} active</span>
        <span>${icon("revenue", "icon-xs")} ${s.revenue.toFixed(0)} PLN</span>
        <span>${icon("warning", "icon-xs")} ${s.warnings} warnings</span>
        <span>${icon("speed", "icon-xs")} ${s.avgSpeed ? s.avgSpeed.toFixed(0) : 0} km/h avg</span>
      </div>
    `;
    roadHealth.appendChild(div);
  });
}

function renderCameraWatch(state) {
  const cameras = [...state.entries.map((g) => ({ ...g, kind: "Entry" })), ...state.exits.map((g) => ({ ...g, kind: "Exit" }))];
  const watchRoutes = new Set((state.alerts || []).map((a) => String(a.route || "").split(":")[0]));
  cameraWatch.innerHTML = "";

  cameras.slice(0, 8).forEach((c, idx) => {
    const hot = watchRoutes.has(c.road);
    const card = document.createElement("div");
    card.className = "camera-card";
    card.innerHTML = `
      <div class="camera-top">
        <div class="camera-id">${icon(c.kind === "Entry" ? "entry" : "exit", "icon-sm")}<span>${c.id}</span></div>
        <span class="badge ${hot ? "warn" : "good"}">${hot ? "Flagged road" : "Clear feed"}</span>
      </div>
      <div class="camera-meta">
        <span>Road ${c.road}</span>
        <span>${c.name}</span>
        <span>Lane ${idx + 1}</span>
      </div>
    `;
    cameraWatch.appendChild(card);
  });
}

function renderRevenueMix(state) {
  const buckets = { low: 0, medium: 0, high: 0 };
  state.activeTrips.forEach((t) => {
    const toll = Number(t.toll || 0);
    if (toll < 80) buckets.low += 1;
    else if (toll <= 160) buckets.medium += 1;
    else buckets.high += 1;
  });
  revenueMix.innerHTML = `
    <div class="mini-stat"><span>${icon("roads", "icon-xs")} Low toll corridors</span><strong>${buckets.low}</strong></div>
    <div class="mini-stat"><span>${icon("roads", "icon-xs")} Medium toll corridors</span><strong>${buckets.medium}</strong></div>
    <div class="mini-stat"><span>${icon("warning", "icon-xs")} High toll corridors</span><strong>${buckets.high}</strong></div>
    <div class="mini-stat"><span>${icon("revenue", "icon-xs")} Total collected</span><strong>${state.revenue.toFixed(0)} PLN</strong></div>
  `;
}

function renderFleetIntel(state) {
  const byMake = {};
  const byColor = {};
  state.activeTrips.forEach((t) => {
    byMake[t.make] = (byMake[t.make] || 0) + 1;
    byColor[t.color] = (byColor[t.color] || 0) + 1;
  });
  const topMake = Object.entries(byMake).sort((a, b) => b[1] - a[1])[0];
  const topColor = Object.entries(byColor).sort((a, b) => b[1] - a[1])[0];
  const avgSpeed = state.activeTrips.length
    ? state.activeTrips.reduce((sum, t) => sum + estimatedSpeed(t), 0) / state.activeTrips.length
    : 0;
  fleetIntel.innerHTML = `
    <div class="mini-stat"><span>${icon("speed", "icon-xs")} Avg live speed</span><strong>${avgSpeed.toFixed(0)} km/h</strong></div>
    <div class="mini-stat"><span>${icon("factory", "icon-xs")} Dominant make</span><strong>${topMake ? `${topMake[0]} · ${topMake[1]}` : "n/a"}</strong></div>
    <div class="mini-stat"><span>${icon("palette", "icon-xs")} Dominant color</span><strong>${topColor ? `${topColor[0]} · ${topColor[1]}` : "n/a"}</strong></div>
    <div class="mini-stat"><span>${icon("density", "icon-xs")} Warning density</span><strong>${state.activeTripCount ? ((state.alerts.length / state.activeTripCount) * 100).toFixed(0) : 0}%</strong></div>
  `;
}

function renderCommandCenter(state) {
  const stats = roadStats(state);
  const hottestRoad = Object.entries(stats).sort((a, b) => b[1].warnings - a[1].warnings)[0];
  const fastest = state.activeTrips
    .map((t) => ({ ...t, speed: estimatedSpeed(t) }))
    .sort((a, b) => b.speed - a.speed)
    .slice(0, 4);
  const recentAlerts = (state.alerts || []).slice().reverse().slice(0, 4);

  overviewBoard.innerHTML = `
    <div class="board-card">
      <h5>Network Posture</h5>
      <p>${state.activeTripCount > 18 ? "Dense motorway flow across primary corridors." : "Moderate motorway load with room for throughput growth."}</p>
    </div>
    <div class="board-card">
      <h5>Most Pressured Road</h5>
      <p>${hottestRoad ? `${hottestRoad[0]} with ${hottestRoad[1].warnings} warnings` : "No hot corridor right now."}</p>
    </div>
    <div class="board-card">
      <h5>Camera Coverage</h5>
      <p>${state.entries.length + state.exits.length} active gate cameras across ${roadSet(state).length} motorway corridors.</p>
    </div>
  `;

  riskBoard.innerHTML = `
    <div class="board-card">
      <h5>Latest Warnings</h5>
      <ul>${recentAlerts.length ? recentAlerts.map((a) => `<li>${escapeHtml(a.type)} · ${escapeHtml(a.vehicleA)} · ${escapeHtml(a.route)}</li>`).join("") : "<li>No warnings</li>"}</ul>
    </div>
    <div class="board-card">
      <h5>Risk Heuristic</h5>
      <p>${state.alerts.length > 6 ? "Escalated monitoring recommended on high-speed corridors." : "Warning volume remains inside expected tolerance."}</p>
    </div>
    <div class="board-card">
      <h5>Operator Note</h5>
      <p>Repeated speeding on the same road is the clearest signal for targeted enforcement placement.</p>
    </div>
  `;

  fleetBoard.innerHTML = `
    <div class="board-card">
      <h5>Fastest Live Cars</h5>
      <ul>${fastest.length ? fastest.map((t) => `<li>${escapeHtml(t.plate)} · ${escapeHtml(t.make)} ${escapeHtml(t.model)} · ${t.speed.toFixed(0)} km/h</li>`).join("") : "<li>No active cars</li>"}</ul>
    </div>
    <div class="board-card">
      <h5>Identity Depth</h5>
      <p>Plate, make, model, color, road, route, camera source, and live toll are currently tracked per active car.</p>
    </div>
    <div class="board-card">
      <h5>Flow Character</h5>
      <p>${state.activeTripCount > 12 ? "Mixed private and long-distance motorway traffic profile." : "Low-volume motorway stream with cleaner camera observability."}</p>
    </div>
  `;
}

function render(state) {
  if (!state) {
    statusEl.textContent = "No response from simulator.";
    return;
  }
  if (state.error) {
    statusEl.textContent = `Simulator error: ${state.error}${state.details ? ` (${state.details})` : ""}`;
    return;
  }

  statusEl.textContent = "";
  mTick.textContent = state.tick;
  mActive.textContent = state.activeTripCount;
  mCompleted.textContent = state.completedTrips;
  mRevenue.textContent = `${state.revenue.toFixed(2)} ${state.currency}`;

  renderHero(state);
  renderRoadHealth(state);
  renderCameraWatch(state);
  renderRevenueMix(state);
  renderFleetIntel(state);
  renderCommandCenter(state);

  entries.innerHTML = "";
  state.entries.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = `${g.road} · ${g.id} - ${g.name}`;
    entries.appendChild(li);
  });

  exits.innerHTML = "";
  state.exits.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = `${g.road} · ${g.id} - ${g.name}`;
    exits.appendChild(li);
  });

  trips.innerHTML = "";
  if (!state.activeTrips.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7" class="small">No active cars</td>';
    trips.appendChild(tr);
  } else {
    state.activeTrips.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.tripId}</td><td>${t.plate}<br/><span class="small">${t.make} ${t.model}, ${t.color}</span></td><td>${t.road}:${t.entryId}</td><td>${t.road}:${t.exitId}</td><td>${t.distanceKm}</td><td>${t.ticksLeft}</td><td>${t.toll.toFixed(2)}</td>`;
      trips.appendChild(tr);
    });
  }

  renderTrafficMap(state);
  renderAlerts(state);
}

async function refresh() {
  render(await window.simApi.getState());
}

async function tick(steps) {
  render(await window.simApi.tick(steps));
}

btnTick1.onclick = () => tick(1);
btnTick5.onclick = () => tick(5);
btnTick20.onclick = () => tick(20);
btnReset.onclick = async () => render(await window.simApi.reset());
btnAuto.onclick = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btnAuto.textContent = "Start Auto";
    return;
  }
  autoTimer = setInterval(() => tick(1), 700);
  btnAuto.textContent = "Stop Auto";
};

hydrateStaticIcons();
refresh();
pollTimer = setInterval(() => {
  refresh();
}, 800);

window.addEventListener("beforeunload", () => {
  if (autoTimer) clearInterval(autoTimer);
  if (pollTimer) clearInterval(pollTimer);
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveTab(btn.dataset.tab);
  });
});
