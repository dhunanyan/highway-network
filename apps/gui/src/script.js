const mTick = document.getElementById("mTick");
const mActive = document.getElementById("mActive");
const mCompleted = document.getElementById("mCompleted");
const mRevenue = document.getElementById("mRevenue");
const entries = document.getElementById("entries");
const exits = document.getElementById("exits");
const trips = document.getElementById("trips");
const statusEl = document.getElementById("status");
const trafficMap = document.getElementById("trafficMap");

const btnTick1 = document.getElementById("tick1");
const btnTick5 = document.getElementById("tick5");
const btnTick20 = document.getElementById("tick20");
const btnAuto = document.getElementById("auto");
const btnReset = document.getElementById("reset");

let autoTimer = null;
let pollTimer = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildGateMap(gates, x) {
  const map = {};
  const count = Math.max(1, gates.length);
  const top = 60;
  const bottom = 300;
  const step = count > 1 ? (bottom - top) / (count - 1) : 0;
  gates.forEach((g, idx) => {
    map[g.id] = { x, y: top + idx * step, gate: g };
  });
  return map;
}

function routeKey(t) {
  return `${t.entryId}->${t.exitId}`;
}

function tollColor(toll) {
  if (toll < 80) return "#34d399";
  if (toll <= 160) return "#f59e0b";
  return "#ef4444";
}

function renderTrafficMap(state) {
  if (!state || state.error) {
    trafficMap.innerHTML = "";
    return;
  }

  const entryPos = buildGateMap(state.entries, 160);
  const exitPos = buildGateMap(state.exits, 1040);
  const laneY = 180;

  let svg = `
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.25" />
            </linearGradient>
          </defs>
          <rect x="120" y="${laneY - 40}" width="960" height="80" rx="20" fill="url(#roadGrad)" />
          <line x1="120" y1="${laneY}" x2="1080" y2="${laneY}" stroke="#334155" stroke-width="3" stroke-dasharray="10 10" />
        `;

  state.entries.forEach((g) => {
    const p = entryPos[g.id];
    svg += `
            <circle cx="${p.x}" cy="${p.y}" r="12" fill="#22c55e" stroke="#bbf7d0" stroke-width="2" />
            <text x="${p.x - 20}" y="${p.y - 18}" fill="#cbd5e1" font-size="12" text-anchor="end">${escapeHtml(g.id)}</text>
            <text x="${p.x - 20}" y="${p.y + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${escapeHtml(g.name)}</text>
          `;
  });

  state.exits.forEach((g) => {
    const p = exitPos[g.id];
    svg += `
            <circle cx="${p.x}" cy="${p.y}" r="12" fill="#f97316" stroke="#fed7aa" stroke-width="2" />
            <text x="${p.x + 20}" y="${p.y - 18}" fill="#cbd5e1" font-size="12" text-anchor="start">${escapeHtml(g.id)}</text>
            <text x="${p.x + 20}" y="${p.y + 4}" fill="#94a3b8" font-size="11" text-anchor="start">${escapeHtml(g.name)}</text>
          `;
  });

  const laneOffsets = {};
  state.activeTrips.forEach((t, idx) => {
    const start = entryPos[t.entryId];
    const end = exitPos[t.exitId];
    if (!start || !end) return;

    const totalTicks = Math.max(1, Number(t.totalTicks || 1));
    const rawProgress = 1 - t.ticksLeft / totalTicks;
    const progress = Math.max(0, Math.min(1, rawProgress));

    const key = routeKey(t);
    const laneIdx = laneOffsets[key] || 0;
    laneOffsets[key] = laneIdx + 1;

    const routeDx = end.x - start.x;
    const routeDy = end.y - start.y;
    const routeLen = Math.max(1, Math.hypot(routeDx, routeDy));
    const normPx = -routeDy / routeLen;
    const normPy = routeDx / routeLen;

    const spread = ((laneIdx % 5) - 2) * 6;
    const routeGroupOffset = ((idx % 3) - 1) * 2;
    const offset = spread + routeGroupOffset;

    const sx = start.x + normPx * offset;
    const sy = start.y + normPy * offset;
    const ex = end.x + normPx * offset;
    const ey = end.y + normPy * offset;

    const vx = sx + (ex - sx) * progress;
    const vy = sy + (ey - sy) * progress;
    const color = tollColor(Number(t.toll || 0));

    svg += `
            <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="2" stroke-dasharray="5 6" opacity="0.92" />
            <circle cx="${vx}" cy="${vy}" r="7" fill="${color}">
              <animate attributeName="r" values="6.5;8;6.5" dur="1.6s" repeatCount="indefinite" />
            </circle>
          `;
  });

  if (!state.activeTrips.length) {
    svg += `<text x="600" y="188" fill="#94a3b8" font-size="14" text-anchor="middle">No active trips on the network</text>`;
  }

  trafficMap.innerHTML = svg;
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
    li.textContent = `${g.id} - ${g.name} (km ${g.km})`;
    entries.appendChild(li);
  });

  exits.innerHTML = "";
  state.exits.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = `${g.id} - ${g.name} (km ${g.km})`;
    exits.appendChild(li);
  });

  trips.innerHTML = "";
  if (!state.activeTrips.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7" class="small">No active trips</td>';
    trips.appendChild(tr);
    renderTrafficMap(state);
    return;
  }

  state.activeTrips.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.tripId}</td><td>${t.plate}</td><td>${t.entryId}</td><td>${t.exitId}</td><td>${t.distanceKm}</td><td>${t.ticksLeft}</td><td>${t.toll.toFixed(2)}</td>`;
    trips.appendChild(tr);
  });

  renderTrafficMap(state);
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
  if (autoTimer) {
    clearInterval(autoTimer);
  }
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
