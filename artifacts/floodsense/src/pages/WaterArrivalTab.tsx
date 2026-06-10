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
  { id: "ADY", name: "Adyar",   base: 64, thr: 80 },
  { id: "COO", name: "Cooum",   base: 58, thr: 80 },
  { id: "BUC", name: "B.Canal", base: 72, thr: 85 },
  { id: "SEA", name: "Bay",     base: 42, thr: 100 },
];

function fillColor(pct: number): string {
  if (pct > 92) return "linear-gradient(180deg,#ff3b5c,#b22234)";
  if (pct > 80) return "linear-gradient(180deg,#ffb020,#d2691e)";
  return "linear-gradient(180deg,#36d6ff,#1a8cff)";
}

export default function WaterArrivalTab() {
  const mapDivRef    = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const flowLinesRef = useRef<Record<string, L.Polyline>>({});
  const overflowRef  = useRef<L.CircleMarker[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const [rain,   setRain]   = useState(120);
  const [gates,  setGates]  = useState<Record<string, number>>(Object.fromEntries(LAKES.map(l => [l.id, l.gate])));
  const [fills,  setFills]  = useState<Record<string, number>>(Object.fromEntries(LAKES.map(l => [l.id, l.fill])));
  const [rcvLvl, setRcvLvl] = useState<Record<string, number>>(Object.fromEntries(RECEIVERS.map(r => [r.id, r.base])));
  const [aiRec,  setAiRec]  = useState("Open Chembarambakkam 45%, Puzhal 30%. Stagger 4h to avoid Adyar surge during high tide.");

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
        .addTo(map)
        .bindPopup(`<b>${l.name}</b><br>Storage: ${l.fill}%<br>Gate: ${l.gate}%<br>Capacity: ${l.cap} mcft`);
      const mkParticle = (offset = 0) => {
        const m = L.circleMarker(l.path[0], { radius: 5, color: "#fff", fillColor: "#00f0ff", fillOpacity: 0.95, weight: 1.5 }).addTo(map);
        let seg = 0; let t = offset;
        const iv = setInterval(() => {
          if (seg >= l.path.length - 1) { seg = 0; t = 0; }
          const a = l.path[seg]; const b = l.path[seg + 1];
          m.setLatLng([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]);
          t += 0.03; if (t >= 1) { t = 0; seg++; }
        }, 80);
        intervalsRef.current.push(iv);
      };
      mkParticle(0); mkParticle(0.5);
    });

    return () => { intervalsRef.current.forEach(clearInterval); map.remove(); };
  }, []);

  /* ── react to rain / gate changes ── */
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    overflowRef.current.forEach(m => map.removeLayer(m));
    overflowRef.current = [];
    let totalDischarge = 0;
    const newFills: Record<string, number> = {};
    LAKES.forEach(l => {
      const gv   = gates[l.id] ?? l.gate;
      const fill = Math.max(0, Math.min(100, l.base + rain * 0.10 - gv * 0.35));
      newFills[l.id] = fill;
      totalDischarge += gv * 120;
      const pl = flowLinesRef.current[l.id];
      if (pl) {
        if (gv < 5)     pl.setStyle({ color: "#555", opacity: 0.4 });
        else if (fill > 92) pl.setStyle({ color: "#ff3b5c", opacity: 0.9 });
        else pl.setStyle({ color: gv > 50 ? "#22e39a" : "#36d6ff", opacity: 0.9 });
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
    const newRcv: Record<string, number> = {};
    RECEIVERS.forEach(r => { newRcv[r.id] = Math.min(120, Math.max(20, r.base + inflow + rain * 0.08)); });
    setRcvLvl(newRcv);
  }, [rain, gates]);

  const totalDischarge = Object.entries(gates).reduce((s, [lid, g]) => s + ((LAKES.find(x => x.id === lid)?.cap ?? 0) > 0 ? g * 120 : 0), 0);
  const travelHrs = Math.max(1, 6 - totalDischarge / 8000).toFixed(1);
  const seaArr    = new Date(Date.now() + parseFloat(travelHrs) * 3600_000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  function handleOptimize() {
    setGates({ CHB: 45, PZL: 35, PND: 25, RDH: 30 });
    setAiRec("AI-optimized: staggered release keeps Adyar < 75% and avoids overflow into Velachery / Pallikaranai. Peak reaches sea in ~4.6 h.");
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>

      {/* ── FULL MAP ─────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />

        {/* Bottom KPI strip — stays on the map but at bottom where it's out of the way */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 500,
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {[
            { label: "Travel Time",      val: travelHrs + " h",                              color: "#36d6ff" },
            { label: "Safe Discharge",   val: Math.round(totalDischarge).toLocaleString() + " cusecs", color: "#22e39a" },
            { label: "Overflow Alerts",  val: String(overflowRef.current.length),             color: "#ff8a3d" },
            { label: "Sea Arrival",      val: seaArr,                                         color: "#00f0ff" },
          ].map(k => (
            <div key={k.label} className="kpi" style={{ minWidth: 110 }}>
              <div className="label">{k.label}</div>
              <div className="val" style={{ color: k.color, fontSize: 16 }}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT CONTROL PANEL ──────────────────── */}
      <div style={{
        width: 340, flexShrink: 0,
        background: "rgba(6,26,46,0.93)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(80,170,255,.15)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5 }}>Hydrology Simulator</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#dbeaff", marginTop: 2 }}>Rainfall + Release Control</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }} className="scrollbar-thin">

          {/* Rainfall slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1 }}>Rainfall Intensity</span>
              <b style={{ color: "#00f0ff", fontSize: 18, fontFamily: "monospace" }}>{rain} mm</b>
            </div>
            <input type="range" min={0} max={300} value={rain} onChange={e => setRain(+e.target.value)}
              style={{ width: "100%", accentColor: "#00f0ff" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#556677", marginTop: 2 }}>
              <span>0</span><span>100</span><span>200</span><span>300 mm</span>
            </div>
          </div>

          {/* Reservoir levels */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#36d6ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Reservoir Levels</div>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
              {LAKES.map(l => {
                const pct = fills[l.id] ?? l.fill;
                return (
                  <div key={l.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9.5, color: "#7da3c9", textAlign: "center", maxWidth: 46 }}>{l.id}</span>
                    <div className="wmeter">
                      <div className="marks" />
                      <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct) }} />
                      <div className="val">{Math.round(pct)}%</div>
                    </div>
                    <span style={{ fontSize: 8.5, color: "#556677", textAlign: "center", maxWidth: 46 }}>{l.name.split(" ")[0]}</span>
                  </div>
                );
              })}

              <div style={{ width: 1, background: "rgba(80,170,255,.15)", alignSelf: "stretch", margin: "0 6px" }} />

              {/* Receiving waters */}
              {RECEIVERS.map(r => {
                const pct = Math.min(100, rcvLvl[r.id] ?? r.base);
                return (
                  <div key={r.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9.5, color: "#7da3c9" }}>{r.id}</span>
                    <div className="wmeter" style={{ height: 120 }}>
                      <div className="marks" />
                      <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct) }} />
                      <div className="val">{Math.round(pct)}%</div>
                    </div>
                    <span style={{ fontSize: 8.5, color: "#556677" }}>{r.name}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 10, color: "#556677" }}>
              <span style={{ background: "rgba(54,214,255,.15)", padding: "2px 8px", borderRadius: 4 }}>Left: Reservoirs</span>
              <span style={{ background: "rgba(255,176,32,.12)", padding: "2px 8px", borderRadius: 4 }}>Right: Receiving Rivers</span>
            </div>
          </div>

          {/* Gate sliders */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#36d6ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Gate Opening (%)</div>
            {LAKES.map(l => {
              const gv  = gates[l.id] ?? l.gate;
              const fil = fills[l.id] ?? l.fill;
              const barColor = fil > 92 ? "#ff3b5c" : fil > 80 ? "#ffb020" : "#22e39a";
              return (
                <div key={l.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: "#dbeaff" }}>{l.name}</span>
                    <span style={{ color: "#00f0ff", fontWeight: 700 }}>{gv}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={gv}
                    onChange={e => setGates(g => ({ ...g, [l.id]: +e.target.value }))}
                    style={{ width: "100%", accentColor: "#00f0ff" }} />
                  {/* fill bar */}
                  <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${fil}%`, background: barColor, borderRadius: 2, transition: "width .6s, background .4s" }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: "#556677", marginTop: 2 }}>Storage: {Math.round(fil)}%</div>
                </div>
              );
            })}
          </div>

          {/* Optimize button */}
          <button onClick={handleOptimize} className="btn-neo" style={{ width: "100%", padding: "10px", borderRadius: 12, marginBottom: 12 }}>
            ⚡ AI-OPTIMIZE GATES
          </button>

          {/* AI recommendation */}
          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.2)", borderRadius: 10, padding: "10px 12px" }}>
            <span className="badge-ai">AI RECOMMENDATION</span>
            <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.6, color: "#dbeaff", margin: "8px 0 0" }}>{aiRec}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
