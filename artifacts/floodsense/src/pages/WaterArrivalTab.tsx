import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { initBaseMap, addAreaMarkers } from "../data/simulatedData";

const SEA: [number, number] = [13.0500, 80.3300];

const LAKES = [
  {
    id: "CHB", name: "Chembarambakkam", ll: [13.0167, 80.0500] as [number, number],
    fill: 78, cap: 3645, gate: 30, base: 78,
    path: [[13.0167, 80.0500], [13.0067, 80.2300], [13.0067, 80.2570], SEA] as [number, number][],
  },
  {
    id: "PZL", name: "Puzhal",           ll: [13.1700, 80.1900] as [number, number],
    fill: 82, cap: 3300, gate: 25, base: 82,
    path: [[13.1700, 80.1900], [13.1100, 80.2400], [13.0710, 80.2880], SEA] as [number, number][],
  },
  {
    id: "PND", name: "Poondi",           ll: [13.3500, 79.9000] as [number, number],
    fill: 71, cap: 3231, gate: 20, base: 71,
    path: [[13.3500, 79.9000], [13.2400, 80.0500], [13.1700, 80.1900]] as [number, number][],
  },
  {
    id: "RDH", name: "Red Hills",        ll: [13.1900, 80.1800] as [number, number],
    fill: 80, cap: 3300, gate: 25, base: 80,
    path: [[13.1900, 80.1800], [13.1100, 80.2500], SEA] as [number, number][],
  },
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
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const flowLinesRef = useRef<Record<string, L.Polyline>>({});
  const overflowRef = useRef<L.CircleMarker[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const [rain, setRain]     = useState(120);
  const [gates, setGates]   = useState<Record<string, number>>(
    Object.fromEntries(LAKES.map(l => [l.id, l.gate]))
  );
  const [fills, setFills]   = useState<Record<string, number>>(
    Object.fromEntries(LAKES.map(l => [l.id, l.fill]))
  );
  const [rcvLvl, setRcvLvl] = useState<Record<string, number>>(
    Object.fromEntries(RECEIVERS.map(r => [r.id, r.base]))
  );
  const [aiRec, setAiRec]   = useState("Open Chembarambakkam 45%, Puzhal 30%. Stagger 4h to avoid Adyar surge during high tide.");

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addAreaMarkers(map);
    mapRef.current = map;

    L.circleMarker(SEA, { radius: 22, color: "#0a4d8c", fillColor: "#1a8cff", fillOpacity: 0.4, weight: 2, className: "ripple-marker" })
      .addTo(map).bindPopup("<b>Bay of Bengal</b><br>Outflow destination");
    L.marker(SEA, {
      icon: L.divIcon({
        className: "",
        html: `<div style="background:#0a2a4d;color:#00f0ff;padding:3px 8px;border-radius:6px;font-weight:700;font-size:11px;border:1px solid #00f0ff;white-space:nowrap">BAY OF BENGAL</div>`,
        iconSize: [120, 18],
      }),
    }).addTo(map);

    LAKES.forEach(l => {
      const pl = L.polyline(l.path, { color: "#36d6ff", weight: 5, opacity: 0.85, className: "flowline" })
        .addTo(map);
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
          const lat = a[0] + (b[0] - a[0]) * t;
          const lng = a[1] + (b[1] - a[1]) * t;
          m.setLatLng([lat, lng]);
          t += 0.03; if (t >= 1) { t = 0; seg++; }
        }, 80);
        intervalsRef.current.push(iv);
      };
      mkParticle(0); mkParticle(0.5);
    });

    return () => {
      intervalsRef.current.forEach(clearInterval);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    overflowRef.current.forEach(m => map.removeLayer(m));
    overflowRef.current = [];

    let totalDischarge = 0;
    const newFills: Record<string, number> = {};

    LAKES.forEach(l => {
      const gv = gates[l.id] ?? l.gate;
      const fill = Math.max(0, Math.min(100, l.base + rain * 0.10 - gv * 0.35));
      newFills[l.id] = fill;
      totalDischarge += gv * 120;

      const pl = flowLinesRef.current[l.id];
      if (pl) {
        if (gv < 5) pl.setStyle({ color: "#555", opacity: 0.4 });
        else if (fill > 92) pl.setStyle({ color: "#ff3b5c", opacity: 0.9 });
        else pl.setStyle({ color: gv > 50 ? "#22e39a" : "#36d6ff", opacity: 0.9 });
      }

      if (fill > 88 || (rain > 180 && gv > 70)) {
        l.path.slice(1, -1).forEach(p => {
          const m = L.circleMarker(
            [p[0] + (Math.random() - 0.5) * 0.01, p[1] + (Math.random() - 0.5) * 0.01],
            { radius: 14, color: "#ff3b5c", fillColor: "#ff3b5c", fillOpacity: 0.45, weight: 2, className: "blink-marker" }
          ).addTo(map).bindPopup("Predicted overflow zone");
          overflowRef.current.push(m);
        });
      }
    });

    setFills(newFills);

    const newRcv: Record<string, number> = {};
    const inflow = totalDischarge / 600;
    RECEIVERS.forEach(r => {
      newRcv[r.id] = Math.min(120, Math.max(20, r.base + inflow + rain * 0.08));
    });
    setRcvLvl(newRcv);
  }, [rain, gates]);

  const totalDischarge = Object.entries(gates).reduce((s, [lid, g]) => {
    const l = LAKES.find(x => x.id === lid);
    return s + (l ? g * 120 : 0);
  }, 0);
  const travelHrs = Math.max(1, (6 - totalDischarge / 8000)).toFixed(1);
  const seaArr    = new Date(Date.now() + parseFloat(travelHrs) * 3600 * 1000)
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  function handleOptimize() {
    const opt = { CHB: 45, PZL: 35, PND: 25, RDH: 30 };
    setGates(opt);
    setAiRec("AI-optimized: staggered release keeps Adyar < 75% and avoids overflow into Velachery / Pallikaranai. Peak reaches sea in ~4.6 h.");
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

      <div className="float absolute top-3 left-3 z-[500] glass p-3 overflow-y-auto scroll-thin"
        style={{ width: 310, maxHeight: "calc(100% - 24px)" }}>
        <div className="section-title mb-2">Rainfall + Release Simulator</div>
        <input type="range" min={0} max={300} value={rain}
          onChange={e => setRain(+e.target.value)}
          style={{ width: "100%", accentColor: "#00f0ff" }} />
        <div className="flex justify-between text-[11px] mt-1" style={{ color: "#7da3c9" }}>
          <span>0</span><span>100</span><span>200</span><span>300 mm</span>
        </div>
        <div className="text-center mt-1"><b style={{ color: "#00f0ff", fontSize: 16 }}>{rain} mm</b></div>

        <hr style={{ borderColor: "rgba(80,170,255,.18)", margin: "10px 0" }} />

        <div className="section-title mb-1 text-[11px]">Lake Gate Opening (%)</div>
        <p style={{ fontSize: 11, color: "#7da3c9", marginBottom: 8 }}>
          AI suggests controlled release so peak reaches sea without flooding villages.
        </p>
        {LAKES.map(l => (
          <div key={l.id} className="gate mb-1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ minWidth: 88, fontSize: 11, color: "#dbeaff" }}>{l.name}</span>
            <input type="range" min={0} max={100} value={gates[l.id] ?? l.gate}
              onChange={e => setGates(g => ({ ...g, [l.id]: +e.target.value }))}
              style={{ flex: 1, accentColor: "#00f0ff" }} />
            <span style={{ minWidth: 34, textAlign: "right", color: "#00f0ff", fontWeight: 700, fontSize: 12 }}>
              {gates[l.id] ?? l.gate}%
            </span>
          </div>
        ))}

        <button
          onClick={handleOptimize}
          className="btn-neo mt-2"
          style={{ width: "100%", padding: "8px", borderRadius: 10, marginTop: 8 }}
        >
          AI-OPTIMIZE GATES
        </button>

        <div className="glass p-2 mt-2" style={{ background: "rgba(0,240,255,.06)", fontSize: 12 }}>
          <span className="badge-ai">AI</span>{" "}
          <span style={{ color: "#dbeaff" }}>{aiRec}</span>
        </div>
      </div>

      <div className="float absolute top-3 z-[500] glass p-3" style={{ left: "50%", transform: "translateX(-50%)" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textAlign: "center", marginBottom: 8 }}>
          RESERVOIR LEVELS
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {LAKES.map(l => {
            const pct = fills[l.id] ?? l.fill;
            return (
              <div key={l.id} title={l.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#7da3c9" }}>{l.id}</span>
                <div className="wmeter">
                  <div className="marks" />
                  <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct) }} />
                  <div className="val">{Math.round(pct)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="float absolute top-3 right-3 z-[500] glass p-3" style={{ minWidth: 160 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textAlign: "center", marginBottom: 8 }}>
          RECEIVING WATERS
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          {RECEIVERS.map(r => {
            const pct = Math.min(100, rcvLvl[r.id] ?? r.base);
            return (
              <div key={r.id} title={r.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#7da3c9" }}>{r.id}</span>
                <div className="wmeter">
                  <div className="marks" />
                  <div className="fill" style={{ height: `${pct}%`, background: fillColor(pct) }} />
                  <div className="val">{Math.round(pct)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="float absolute bottom-3 left-3 z-[500] flex gap-2 flex-wrap">
        {[
          { label: "Travel Time",     val: travelHrs + " h",                   color: "#36d6ff" },
          { label: "Safe Discharge",  val: Math.round(totalDischarge).toLocaleString() + " cusecs", color: "#22e39a" },
          { label: "Villages at Risk",val: overflowRef.current.length.toString(), color: "#ff8a3d" },
          { label: "Sea Arrival",     val: seaArr,                              color: "#00f0ff" },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="label">{k.label}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
