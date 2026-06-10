import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { initBaseMap, addAreaMarkers } from "../data/simulatedData";

const SEA: [number, number] = [13.0500, 80.3300];

const LAKES = [
  { id: "CHB", name: "Chembarambakkam", ll: [13.0167, 80.0500] as [number,number], fill: 78, cap: 3645, gate: 30, base: 78, path: [[13.0167,80.0500],[13.0067,80.2300],[13.0067,80.2570],SEA] as [number,number][] },
  { id: "PZL", name: "Puzhal",          ll: [13.1700, 80.1900] as [number,number], fill: 82, cap: 3300, gate: 25, base: 82, path: [[13.1700,80.1900],[13.1100,80.2400],[13.0710,80.2880],SEA] as [number,number][] },
  { id: "PND", name: "Poondi",          ll: [13.3500, 79.9000] as [number,number], fill: 71, cap: 3231, gate: 20, base: 71, path: [[13.3500,79.9000],[13.2400,80.0500],[13.1700,80.1900]] as [number,number][] },
  { id: "RDH", name: "Red Hills",       ll: [13.1900, 80.1800] as [number,number], fill: 80, cap: 3300, gate: 25, base: 80, path: [[13.1900,80.1800],[13.1100,80.2500],SEA] as [number,number][] },
];

const RECEIVERS = [
  { id: "ADY", name: "Adyar River",      base: 64, thr: 80  },
  { id: "COO", name: "Cooum River",      base: 58, thr: 80  },
  { id: "BUC", name: "Buckingham Canal", base: 72, thr: 85  },
  { id: "SEA", name: "Bay of Bengal",    base: 42, thr: 100 },
];

function fillColor(pct: number) {
  if (pct > 92) return "linear-gradient(180deg,#ff3b5c,#b22234)";
  if (pct > 80) return "linear-gradient(180deg,#ffb020,#d2691e)";
  return "linear-gradient(180deg,#36d6ff,#1a8cff)";
}

function statusColor(pct: number) {
  if (pct > 92) return "#ff3b5c";
  if (pct > 80) return "#ffb020";
  return "#22e39a";
}

export default function WaterArrivalTab() {
  const mapDivRef    = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const flowLinesRef = useRef<Record<string, L.Polyline>>({});
  const overflowRef  = useRef<L.CircleMarker[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const [rain,   setRain]   = useState(120);
  const [gates,  setGates]  = useState<Record<string,number>>(Object.fromEntries(LAKES.map(l => [l.id, l.gate])));
  const [fills,  setFills]  = useState<Record<string,number>>(Object.fromEntries(LAKES.map(l => [l.id, l.fill])));
  const [rcvLvl, setRcvLvl] = useState<Record<string,number>>(Object.fromEntries(RECEIVERS.map(r => [r.id, r.base])));
  const [aiRec,  setAiRec]  = useState("Open Chembarambakkam 45%, Puzhal 30%. Stagger 4h to avoid Adyar surge during high tide.");
  const [optimized, setOptimized] = useState(false);

  /* ── map init ── */
  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addAreaMarkers(map);
    mapRef.current = map;

    L.circleMarker(SEA, { radius: 22, color: "#0a4d8c", fillColor: "#1a8cff", fillOpacity: 0.4, weight: 2, className: "ripple-marker" })
      .addTo(map).bindPopup("<b>Bay of Bengal</b><br>Outflow destination");
    L.marker(SEA, { icon: L.divIcon({ className: "", html: `<div style="background:#0a2a4d;color:#00f0ff;padding:3px 8px;border-radius:6px;font-weight:700;font-size:11px;border:1px solid #00f0ff;white-space:nowrap">BAY OF BENGAL</div>`, iconSize: [120,18] }) }).addTo(map);

    LAKES.forEach(l => {
      const pl = L.polyline(l.path, { color: "#36d6ff", weight: 5, opacity: 0.85, className: "flowline" }).addTo(map);
      flowLinesRef.current[l.id] = pl;
      L.circleMarker(l.ll, { radius: 14, color: "#00f0ff", fillColor: "#1a8cff", fillOpacity: 0.6, weight: 2, className: "ripple-marker" })
        .addTo(map).bindPopup(`<b>${l.name}</b><br>Storage: ${l.fill}%<br>Gate: ${l.gate}%<br>Capacity: ${l.cap} mcft`);
      const mkParticle = (offset = 0) => {
        const m = L.circleMarker(l.path[0], { radius: 5, color: "#fff", fillColor: "#00f0ff", fillOpacity: 0.95, weight: 1.5 }).addTo(map);
        let seg = 0; let t = offset;
        const iv = setInterval(() => {
          if (seg >= l.path.length - 1) { seg = 0; t = 0; }
          const a = l.path[seg]; const b = l.path[seg + 1];
          m.setLatLng([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]);
          t += 0.03; if (t >= 1) { t = 0; seg++; }
        }, 80);
        intervalsRef.current.push(iv);
      };
      mkParticle(0); mkParticle(0.5);
    });

    return () => { intervalsRef.current.forEach(clearInterval); map.remove(); };
  }, []);

  /* ── react to rain / gates ── */
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    overflowRef.current.forEach(m => map.removeLayer(m));
    overflowRef.current = [];
    let totalDischarge = 0;
    const newFills: Record<string,number> = {};
    LAKES.forEach(l => {
      const gv   = gates[l.id] ?? l.gate;
      const fill = Math.max(0, Math.min(100, l.base + rain * 0.10 - gv * 0.35));
      newFills[l.id] = fill; totalDischarge += gv * 120;
      const pl = flowLinesRef.current[l.id];
      if (pl) {
        if (gv < 5)        pl.setStyle({ color: "#555", opacity: 0.4 });
        else if (fill > 92) pl.setStyle({ color: "#ff3b5c", opacity: 0.9 });
        else               pl.setStyle({ color: gv > 50 ? "#22e39a" : "#36d6ff", opacity: 0.9 });
      }
      if (fill > 88 || (rain > 180 && gv > 70)) {
        l.path.slice(1, -1).forEach(p => {
          const m = L.circleMarker(
            [p[0]+(Math.random()-.5)*.01, p[1]+(Math.random()-.5)*.01],
            { radius: 14, color: "#ff3b5c", fillColor: "#ff3b5c", fillOpacity: 0.45, weight: 2, className: "blink-marker" }
          ).addTo(map).bindPopup("Predicted overflow zone");
          overflowRef.current.push(m);
        });
      }
    });
    setFills(newFills);
    const inflow = totalDischarge / 600;
    const newRcv: Record<string,number> = {};
    RECEIVERS.forEach(r => { newRcv[r.id] = Math.min(120, Math.max(20, r.base + inflow + rain * 0.08)); });
    setRcvLvl(newRcv);
  }, [rain, gates]);

  const totalDischarge = Object.entries(gates).reduce((s, [lid, g]) => s + (LAKES.find(x => x.id === lid) ? g * 120 : 0), 0);
  const travelHrs = Math.max(1, 6 - totalDischarge / 8000).toFixed(1);
  const seaArr    = new Date(Date.now() + parseFloat(travelHrs) * 3600_000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  function handleOptimize() {
    setGates({ CHB: 45, PZL: 35, PND: 25, RDH: 30 });
    setOptimized(true);
    setAiRec("Staggered release keeps Adyar < 75% and avoids overflow into Velachery / Pallikaranai. Peak reaches sea in ~4.6 h.");
  }

  /* shared panel header style */
  const panelHdr = (label: string) => (
    <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(80,170,255,.15)", flexShrink: 0 }}>
      <div style={{ fontSize: 9.5, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>

      {/* ── 1. MAP ────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />

        {/* KPIs at bottom-left */}
        <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 500, display: "flex", gap: 8 }}>
          {[
            { label: "Travel Time",    val: travelHrs + " h",                              color: "#36d6ff" },
            { label: "Safe Discharge", val: Math.round(totalDischarge).toLocaleString() + " c", color: "#22e39a" },
            { label: "Sea Arrival",    val: seaArr,                                         color: "#00f0ff" },
          ].map(k => (
            <div key={k.label} className="kpi" style={{ minWidth: 90 }}>
              <div className="label">{k.label}</div>
              <div className="val" style={{ color: k.color, fontSize: 15 }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Rain badge top-right of map */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 500,
          background: "rgba(6,26,46,.88)", border: "1px solid rgba(80,170,255,.25)",
          padding: "6px 14px", borderRadius: 10, textAlign: "center",
        }}>
          <div style={{ fontSize: 9.5, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1 }}>Rainfall</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#00f0ff", fontFamily: "monospace" }}>{rain} mm</div>
          <input type="range" min={0} max={300} value={rain} onChange={e => setRain(+e.target.value)}
            style={{ width: 110, accentColor: "#00f0ff", marginTop: 4 }} />
        </div>
      </div>

      {/* ── 2. RESERVOIR LEVELS (middle panel) ──────── */}
      <div style={{
        width: 230, flexShrink: 0,
        background: "rgba(6,26,46,0.93)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {panelHdr("Reservoir Levels")}

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }} className="scrollbar-thin">

          {/* Reservoir water meters */}
          <div style={{ fontSize: 10, color: "#36d6ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
            Source Reservoirs
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", marginBottom: 20 }}>
            {LAKES.map(l => {
              const pct = fills[l.id] ?? l.fill;
              return (
                <div key={l.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div className="wmeter">
                    <div className="marks" />
                    <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct), transition: "height .8s ease" }} />
                    <div className="val">{Math.round(pct)}%</div>
                  </div>
                  <span style={{ fontSize: 9, color: statusColor(pct), fontWeight: 700, textAlign: "center", maxWidth: 44 }}>
                    {l.id}
                  </span>
                  {optimized && (
                    <span style={{ fontSize: 8, color: "#22e39a", background: "rgba(34,227,154,.15)", padding: "1px 4px", borderRadius: 4, border: "1px solid rgba(34,227,154,.3)" }}>
                      OPT
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Labels below meters */}
          <div style={{ borderTop: "1px solid rgba(80,170,255,.12)", paddingTop: 10, marginBottom: 20 }}>
            {LAKES.map(l => {
              const pct = fills[l.id] ?? l.fill;
              const gv  = gates[l.id] ?? l.gate;
              return (
                <div key={l.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", marginBottom: 4, borderRadius: 7,
                  background: `${statusColor(pct)}10`, border: `1px solid ${statusColor(pct)}30`,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#dbeaff", fontWeight: 600 }}>{l.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 9.5, color: "#556677" }}>{l.cap.toLocaleString()} mcft</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: statusColor(pct) }}>{Math.round(pct)}%</div>
                    <div style={{ fontSize: 9.5, color: "#7da3c9" }}>Gate {gv}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Receiving waters */}
          <div style={{ fontSize: 10, color: "#36d6ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
            Receiving Waters
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", marginBottom: 14 }}>
            {RECEIVERS.map(r => {
              const pct = Math.min(100, rcvLvl[r.id] ?? r.base);
              return (
                <div key={r.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div className="wmeter" style={{ height: 120 }}>
                    <div className="marks" />
                    <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct), transition: "height .8s ease" }} />
                    <div className="val">{Math.round(pct)}%</div>
                  </div>
                  <span style={{ fontSize: 9, color: statusColor(pct), fontWeight: 700 }}>{r.id}</span>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid rgba(80,170,255,.12)", paddingTop: 10 }}>
            {RECEIVERS.map(r => {
              const pct = Math.min(100, rcvLvl[r.id] ?? r.base);
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 11 }}>
                  <span style={{ color: "#dbeaff" }}>{r.name}</span>
                  <span style={{ color: statusColor(pct), fontWeight: 700 }}>{Math.round(pct)}%
                    {pct > r.thr * 0.9 && <span style={{ color: "#ff3b5c", marginLeft: 4, fontSize: 10 }}>⚠</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. GATE CONTROL + AI (right panel) ───────── */}
      <div style={{
        width: 270, flexShrink: 0,
        background: "rgba(4,18,36,0.96)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {panelHdr("Gate Opening (%)")}

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }} className="scrollbar-thin">
          <p style={{ fontSize: 11, color: "#7da3c9", marginBottom: 12, lineHeight: 1.5 }}>
            Adjust each gate to control stormwater release into the city's river network.
          </p>

          {LAKES.map(l => {
            const gv  = gates[l.id] ?? l.gate;
            const fil = fills[l.id] ?? l.fill;
            const sc  = statusColor(fil);
            return (
              <div key={l.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: "#dbeaff", fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 9.5, color: "#556677" }}>Storage: <span style={{ color: sc }}>{Math.round(fil)}%</span></div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#00f0ff", fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>{gv}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={gv}
                  onChange={e => { setGates(g => ({ ...g, [l.id]: +e.target.value })); setOptimized(false); }}
                  style={{ width: "100%", accentColor: "#00f0ff" }}
                />
                {/* flow bar */}
                <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${gv}%`, background: gv > 60 ? "#22e39a" : "#36d6ff", borderRadius: 2, transition: "width .5s, background .4s" }} />
                </div>
              </div>
            );
          })}

          {/* AI Optimize button */}
          <button
            onClick={handleOptimize}
            style={{
              width: "100%", padding: "11px", borderRadius: 12, marginTop: 4, marginBottom: 14,
              background: optimized
                ? "linear-gradient(90deg,#22e39a,#1a8cff)"
                : "linear-gradient(90deg,#1a8cff,#00f0ff)",
              border: "none", color: "#001", fontWeight: 700, cursor: "pointer",
              fontSize: 13, letterSpacing: .5,
              boxShadow: optimized ? "0 0 20px rgba(34,227,154,.4)" : "0 0 16px rgba(0,240,255,.35)",
              transition: "all .4s",
            }}
          >
            {optimized ? "✓ AI OPTIMIZED" : "⚡ AI-OPTIMIZE GATES"}
          </button>

          {/* AI recommendation */}
          <div style={{
            background: optimized ? "rgba(34,227,154,.07)" : "rgba(0,240,255,.06)",
            border: `1px solid ${optimized ? "rgba(34,227,154,.25)" : "rgba(0,240,255,.18)"}`,
            borderRadius: 10, padding: "10px 12px",
            transition: "all .4s",
          }}>
            <span className="badge-ai">AI</span>
            <p style={{ marginTop: 8, fontSize: 11, lineHeight: 1.6, color: "#dbeaff", margin: "8px 0 0" }}>{aiRec}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
