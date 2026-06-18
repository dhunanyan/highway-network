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
        <span class="alert-icon">⚠</span>
        <span>
          <strong>${escapeHtml(a.type || "warning")}</strong> [t=${a.tick}] ${escapeHtml(a.message)}<br/>
          Car: ${escapeHtml(a.vehicleA || "n/a")} · ${escapeHtml(a.make || "?")} ${escapeHtml(a.model || "?")} · ${escapeHtml(a.color || "?")}<br/>
          Camera: ${escapeHtml(a.cameraId || "CAM-UNKNOWN")} · Speed: ${Number(a.measuredSpeedKmh || 0).toFixed(1)} km/h / Limit ${Number(a.speedLimitKmh || 0).toFixed(0)} km/h · Route ${escapeHtml(a.route || "")}
        </span>
      `;
      alertsEl.appendChild(item);
    });
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

refresh();
pollTimer = setInterval(() => {
  refresh();
}, 800);

window.addEventListener("beforeunload", () => {
  if (autoTimer) clearInterval(autoTimer);
  if (pollTimer) clearInterval(pollTimer);
});
