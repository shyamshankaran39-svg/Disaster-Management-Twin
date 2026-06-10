import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { initBaseMap, addAreaMarkers } from "../data/simulatedData";

const OUT_COOUM:  [number, number] = [13.0570, 80.2920];
const OUT_ADYAR:  [number, number] = [13.0030, 80.2700];
const OUT_OKKIYAM:[number, number] = [12.8870, 80.2470];
const OUT_KOSAS:  [number, number] = [13.2080, 80.3260];

const NODES: Record<string, { name: string; ll: [number, number]; type: "pump"|"lake"|"jn"|"col"|"trunk" }> = {
  TNG:    { name: "T.Nagar Pump Stn",      ll: [13.0418, 80.2341], type: "pump"  },
  KOD:    { name: "Kodambakkam Jn",         ll: [13.0510, 80.2210], type: "jn"    },
  NUN:    { name: "Nungambakkam Lake",       ll: [13.0610, 80.2410], type: "lake"  },
  CHE:    { name: "Chetpet Drain",           ll: [13.0720, 80.2430], type: "jn"    },
  EGM:    { name: "Egmore Collector",        ll: [13.0780, 80.2610], type: "col"   },
  COOUM_M:{ name: "Cooum @ Chintadripet",    ll: [13.0700, 80.2750], type: "trunk" },
  ASH:    { name: "Ashok Nagar Drain",       ll: [13.0350, 80.2110], type: "jn"    },
  SAI:    { name: "Saidapet Jn",             ll: [13.0220, 80.2280], type: "jn"    },
  GUI:    { name: "Guindy Pump Stn",         ll: [13.0067, 80.2206], type: "pump"  },
  ADY:    { name: "Adyar Bridge Trunk",      ll: [13.0040, 80.2520], type: "trunk" },
  TAM:    { name: "Tambaram Trunk",          ll: [12.9229, 80.1275], type: "jn"    },
  VEL:    { name: "Velachery Lake",          ll: [12.9750, 80.2200], type: "lake"  },
  TAR:    { name: "Taramani Drain",          ll: [12.9870, 80.2420], type: "jn"    },
  PER:    { name: "Perungudi Collector",     ll: [12.9617, 80.2467], type: "col"   },
  PAL:    { name: "Pallikaranai Marsh",      ll: [12.9430, 80.2120], type: "lake"  },
  SHO:    { name: "Sholinganallur Drain",    ll: [12.9010, 80.2279], type: "jn"    },
  OKK:    { name: "Okkiyam Maduvu Trunk",    ll: [12.9150, 80.2380], type: "trunk" },
  ANN:    { name: "Anna Nagar Drain",        ll: [13.0860, 80.2200], type: "jn"    },
  VYS:    { name: "Vyasarpadi Jn",           ll: [13.1180, 80.2580], type: "jn"    },
  MAN:    { name: "Manali Collector",        ll: [13.1650, 80.2680], type: "col"   },
  BCAN_N: { name: "Buckingham Canal N",      ll: [13.1900, 80.2980], type: "trunk" },
};

const OUTFALLS: Record<string, [number, number]> = { OUT_COOUM, OUT_ADYAR, OUT_OKKIYAM, OUT_KOSAS };

const RAW_EDGES: [string, string, boolean, boolean][] = [
  ["TNG","KOD",false,false], ["KOD","NUN",false,true ], ["NUN","CHE",false,false],
  ["CHE","EGM",false,false], ["EGM","COOUM_M",false,false], ["COOUM_M","OUT_COOUM",false,false],
  ["ASH","KOD",false,false],
  ["TAM","GUI",false,false], ["GUI","SAI",false,false], ["ASH","SAI",false,false],
  ["SAI","ADY",true,false], ["ADY","OUT_ADYAR",false,false],
  ["VEL","PAL",false,false], ["TAR","PER",false,false], ["PER","PAL",false,true],
  ["PAL","OKK",false,false], ["SHO","OKK",true,false], ["OKK","OUT_OKKIYAM",false,false],
  ["ANN","VYS",false,false], ["VYS","MAN",false,true], ["MAN","BCAN_N",false,false],
  ["BCAN_N","OUT_KOSAS",false,false], ["EGM","VYS",false,false],
];

function getLl(key: string): [number, number] {
  if (NODES[key]) return NODES[key].ll;
  if (OUTFALLS[key]) return OUTFALLS[key];
  return [13.0827, 80.2707];
}

type EdgeState = {
  from: string; to: string;
  seg: [[number,number],[number,number]];
  blocked: boolean; baseBlocked: boolean;
  congested: boolean; baseCongested: boolean;
  pl: L.Polyline; particle: L.CircleMarker;
  blockIcon: L.Marker | null; t: number; flowing: boolean;
};

// ── live sensor telemetry ──────────────────────────────────────────
const LIVE_SENSORS = [
  { id: "DRN-TNG", name: "T.Nagar Pump",    baseFlow: 4.2, baseDep: 0.8,  thr: 6.5, node: "TNG" },
  { id: "DRN-GUI", name: "Guindy Pump",      baseFlow: 5.1, baseDep: 1.1,  thr: 7.0, node: "GUI" },
  { id: "DRN-VEL", name: "Velachery Lake",   baseFlow: 3.8, baseDep: 1.8,  thr: 4.0, node: "VEL" },
  { id: "DRN-PAL", name: "Pallikaranai",     baseFlow: 6.9, baseDep: 2.4,  thr: 5.0, node: "PAL" },
  { id: "DRN-PER", name: "Perungudi Coll.",  baseFlow: 4.5, baseDep: 1.2,  thr: 6.0, node: "PER" },
  { id: "DRN-SAI", name: "Saidapet Jn",      baseFlow: 3.2, baseDep: 0.9,  thr: 5.5, node: "SAI" },
  { id: "DRN-MAN", name: "Manali Collector", baseFlow: 2.8, baseDep: 0.6,  thr: 5.0, node: "MAN" },
  { id: "DRN-SHO", name: "Sholinganallur",   baseFlow: 5.6, baseDep: 1.5,  thr: 5.5, node: "SHO" },
];

type SensorReading = {
  id: string; name: string; flow: number; depth: number; thr: number; alarm: boolean;
};

function randJitter(base: number, pct = 0.08): number {
  return +(base * (1 + (Math.random() - 0.5) * pct * 2)).toFixed(2);
}

// ─────────────────────────────────────────────────────────────────

export default function DrainageTab() {
  const mapDivRef    = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const edgesRef     = useRef<EdgeState[]>([]);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const telemetryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [rainfall,  setRainfall]  = useState(80);
  const [stats,     setStats]     = useState({ stagnation: 28, risk: "Moderate", overflow: 14, blocked: "3 / 23" });
  const [sensors,   setSensors]   = useState<SensorReading[]>(() =>
    LIVE_SENSORS.map(s => ({ id: s.id, name: s.name, flow: s.baseFlow, depth: s.baseDep, thr: s.thr, alarm: s.baseDep > s.thr * 0.9 }))
  );
  const [lastPulse, setLastPulse] = useState(Date.now());
  const [alerts,    setAlerts]    = useState<string[]>([]);
  const rainfallRef = useRef(rainfall);
  rainfallRef.current = rainfall;

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 12);
    mapRef.current = map;
    addAreaMarkers(map);

    ([["Cooum Mouth", OUT_COOUM], ["Adyar Estuary", OUT_ADYAR], ["Okkiyam Maduvu", OUT_OKKIYAM], ["Ennore Creek", OUT_KOSAS]] as [string, [number,number]][]).forEach(([nm, o]) => {
      L.circleMarker(o, { radius: 14, color: "#0a4d8c", fillColor: "#1a8cff", fillOpacity: 0.5, weight: 2, className: "ripple-marker" }).addTo(map);
      L.marker(o, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#0a2a4d;color:#00f0ff;padding:2px 6px;border-radius:5px;font-weight:700;font-size:10px;border:1px solid #00f0ff;white-space:nowrap">&#x1F30A; ${nm}</div>`,
          iconSize: [120, 14],
        }),
      }).addTo(map);
    });

    const edges: EdgeState[] = RAW_EDGES.map(([a, b, baseBlocked, baseCongested]) => {
      const seg: [[number,number],[number,number]] = [getLl(a), getLl(b)];
      const col = baseBlocked ? "#ff3b5c" : baseCongested ? "#ffb020" : "#22e39a";
      const cls = "flowline" + (baseBlocked ? " blocked" : baseCongested ? " warn" : "");
      const pl  = L.polyline(seg, { color: col, weight: 5, opacity: 0.9, className: cls }).addTo(map);
      const nm  = (NODES[a]?.name ?? a) + " → " + (NODES[b]?.name ?? b);
      pl.bindPopup(`<b>${nm}</b><br>Status: ${baseBlocked ? "🔴 BLOCKED" : baseCongested ? "🟠 Congested" : "🟢 Flowing"}<br><i style="font-size:11px;color:#888">Click to toggle blockage</i>`);
      const particle = L.circleMarker(seg[0], { radius: 5, color: "#fff", fillColor: "#00f0ff", fillOpacity: 0.95, weight: 1.5 }).addTo(map);
      const e: EdgeState = { from: a, to: b, seg, blocked: baseBlocked, baseBlocked, congested: baseCongested, baseCongested, pl, particle, blockIcon: null, t: Math.random(), flowing: !baseBlocked };
      pl.on("click", () => { e.blocked = !e.blocked; e.baseBlocked = e.blocked; doRefreshFlow(); });
      return e;
    });

    edgesRef.current = edges;
    doRefreshFlow();

    // particle animation
    intervalRef.current = setInterval(() => {
      edges.forEach(e => {
        if (!e.flowing) return;
        const speed = e.congested ? 0.012 : 0.035;
        e.t += speed; if (e.t >= 1) e.t = 0;
        const [a, b] = e.seg;
        e.particle.setLatLng([a[0] + (b[0] - a[0]) * e.t, a[1] + (b[1] - a[1]) * e.t]);
      });
    }, 80);

    // sensor node markers on map
    Object.entries(NODES).forEach(([k, n]) => {
      const bg = { lake: "#1a8cff", pump: "#ffb020", trunk: "#00f0ff", col: "#22e39a", jn: "#36d6ff" }[n.type];
      L.circleMarker(n.ll, { radius: 6, color: bg, fillColor: "#fff", fillOpacity: 0.95, weight: 2 })
        .addTo(map)
        .bindPopup(`<b>${n.name}</b><br>Type: ${n.type.toUpperCase()}<br>Sensor: DRN-${k}`);
      L.marker(n.ll, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:rgba(10,42,77,.85);color:${bg};font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid ${bg};white-space:nowrap;transform:translate(10px,6px)">${n.name}</div>`,
          iconSize: [150, 14],
        }),
      }).addTo(map);
    });

    // live telemetry — update every 3 seconds
    telemetryRef.current = setInterval(() => {
      const r = rainfallRef.current;
      const rainFactor = 1 + r / 150;
      setSensors(LIVE_SENSORS.map(s => {
        const flow  = randJitter(s.baseFlow * rainFactor);
        const depth = randJitter(s.baseDep  * rainFactor);
        const alarm = depth > s.thr * 0.9 || flow > s.thr;
        return { id: s.id, name: s.name, flow, depth, thr: s.thr, alarm };
      }));
      setLastPulse(Date.now());
      setAlerts(prev => {
        const newAlerts: string[] = [];
        LIVE_SENSORS.forEach(s => {
          const d = randJitter(s.baseDep * rainFactor);
          if (d > s.thr * 0.9) newAlerts.push(`${s.name}: depth ${d.toFixed(1)}m exceeds threshold`);
        });
        if (newAlerts.length === 0) return prev;
        return [...newAlerts, ...prev].slice(0, 5);
      });
    }, 3000);

    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (telemetryRef.current) clearInterval(telemetryRef.current);
      map.remove();
    };
  }, []);

  function isStarved(node: string, visited = new Set<string>()): boolean {
    if (visited.has(node)) return true; visited.add(node);
    const incoming = edgesRef.current.filter(e => e.to === node);
    if (incoming.length === 0) return false;
    return incoming.every(e => e.blocked || isStarved(e.from, new Set(visited)));
  }

  const doRefreshFlow = useCallback(() => {
    const map = mapRef.current; if (!map) return;
    edgesRef.current.forEach(e => { if (e.blockIcon) { map.removeLayer(e.blockIcon); e.blockIcon = null; } });
    edgesRef.current.forEach(e => {
      const starved = !e.blocked && isStarved(e.from);
      let col: string, cls = "flowline", flowing = true;
      if (e.blocked) {
        col = "#ff3b5c"; cls += " blocked"; flowing = false;
        const mid: [number, number] = [(e.seg[0][0] + e.seg[1][0]) / 2, (e.seg[0][1] + e.seg[1][1]) / 2];
        e.blockIcon = L.marker(mid, {
          icon: L.divIcon({ className: "", html: `<div style="background:#ff3b5c;color:#fff;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;box-shadow:0 0 12px #ff3b5c">BLOCKAGE</div>`, iconSize: [80, 16] }),
        }).addTo(map);
      } else if (starved) {
        col = "#7a3a55"; flowing = false; cls += " blocked";
      } else if (e.congested) {
        col = "#ffb020"; cls += " warn";
      } else {
        col = "#22e39a";
      }
      e.pl.setStyle({ color: col });
      const el = e.pl.getElement();
      if (el) el.setAttribute("class", cls);
      e.flowing = flowing;
      e.particle.setStyle(flowing
        ? { opacity: 1, fillOpacity: 0.95, fillColor: e.congested ? "#ffb020" : "#00f0ff" }
        : { opacity: 0, fillOpacity: 0 });
    });
    const blockedCount = edgesRef.current.filter(e => e.blocked).length;
    setStats(s => ({ ...s, blocked: `${blockedCount} / ${edgesRef.current.length}` }));
  }, []);

  useEffect(() => {
    if (!mapRef.current || edgesRef.current.length === 0) return;
    const heavyRain = rainfall > 200;
    edgesRef.current.forEach((e, idx) => {
      const highRisk = [11, 15, 3, 19].includes(idx);
      if (!e.baseBlocked) {
        e.blocked   = heavyRain && highRisk;
        e.congested = e.baseCongested || (rainfall > 100 && [1, 7, 14, 20].includes(idx));
      }
    });
    doRefreshFlow();
    setStats({
      stagnation: Math.min(95, Math.round(20 + rainfall / 3.5)),
      risk: rainfall > 200 ? "CRITICAL" : rainfall > 120 ? "HIGH" : "Moderate",
      overflow: Math.round(8 + rainfall / 20),
      blocked: `${edgesRef.current.filter(e => e.blocked).length} / ${edgesRef.current.length}`,
    });
  }, [rainfall]);

  const alarmCount = sensors.filter(s => s.alarm).length;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* MAP */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />

        {/* Top-left: stressor control */}
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 500,
          background: "rgba(6,26,46,.92)", border: "1px solid rgba(80,170,255,.25)",
          borderRadius: 12, padding: "12px 14px", width: 270,
        }}>
          <div style={{ fontSize: 11, color: "#36d6ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Drainage Stressor</div>
          <input type="range" min={0} max={300} value={rainfall}
            onChange={e => setRainfall(+e.target.value)}
            style={{ width: "100%", accentColor: "#00f0ff" }} />
          <div style={{ marginTop: 4, textAlign: "center" }}>
            <b style={{ color: "#00f0ff", fontSize: 16 }}>{rainfall} mm/hr</b>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, fontSize: 11 }}>
            {[["#22e39a","Flowing"],["#ffb020","Congested"],["#ff3b5c","Blocked"]].map(([c,l]) => (
              <span key={l} className="chip" style={{ fontSize: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", marginRight: 4 }}></span>{l}
              </span>
            ))}
          </div>
          <button
            className="btn-neo"
            style={{ width: "100%", padding: "7px", borderRadius: 10, marginTop: 10 }}
            onClick={() => { edgesRef.current.forEach(e => { e.blocked = false; e.congested = e.baseCongested; }); doRefreshFlow(); }}
          >
            SIMULATE DESILTING
          </button>
        </div>

        {/* Bottom legend */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 500,
          background: "rgba(6,26,46,.88)", border: "1px solid rgba(80,170,255,.2)",
          padding: "7px 12px", borderRadius: 8, fontSize: 11.5,
        }}>
          <b style={{ color: "#36d6ff" }}>LEGEND</b>&nbsp;&nbsp;
          <span style={{ color: "#22e39a" }}>━━</span> Flowing &nbsp;
          <span style={{ color: "#ffb020" }}>━━</span> Congested &nbsp;
          <span style={{ color: "#ff3b5c" }}>━━</span> Blocked
        </div>
      </div>

      {/* RIGHT PANEL — live telemetry */}
      <div style={{
        width: 310, flexShrink: 0,
        background: "rgba(6,26,46,0.93)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Telemetry header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(80,170,255,.15)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5 }}>Live Telemetry</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#dbeaff", marginTop: 2 }}>Sensor Network</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,227,154,.12)", border: "1px solid rgba(34,227,154,.3)", borderRadius: 999, padding: "3px 10px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22e39a", animation: "pulse-dot 1.4s infinite", display: "inline-block" }}></span>
              <span style={{ fontSize: 10, color: "#22e39a", fontWeight: 700 }}>3s PULSE</span>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 14px", borderBottom: "1px solid rgba(80,170,255,.12)", flexShrink: 0 }}>
          {[
            { label: "Stagnation",       val: stats.stagnation + "%", color: "#ffb020" },
            { label: "Failure Risk",     val: stats.risk,              color: rainfall > 200 ? "#ff3b5c" : "#ffb020" },
            { label: "Overflow Zones",   val: String(stats.overflow),  color: "#ff8a3d" },
            { label: "Blocked Segments", val: stats.blocked,           color: "#ff3b5c" },
          ].map(k => (
            <div key={k.label} className="kpi" style={{ minWidth: 0, padding: "8px 10px" }}>
              <div className="label" style={{ fontSize: 10 }}>{k.label}</div>
              <div className="val" style={{ color: k.color, fontSize: 16 }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Alarms */}
        {alarmCount > 0 && (
          <div style={{ margin: "10px 14px 0", background: "rgba(255,59,92,.12)", border: "1px solid rgba(255,59,92,.35)", borderRadius: 10, padding: "8px 12px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff3b5c", animation: "pulse-dot 1s infinite", display: "inline-block" }}></span>
              <span style={{ fontSize: 11, color: "#ff3b5c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                {alarmCount} Sensor Alarm{alarmCount > 1 ? "s" : ""}
              </span>
            </div>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} style={{ fontSize: 10.5, color: "#ffb080", marginBottom: 3, paddingLeft: 12, borderLeft: "2px solid #ff3b5c" }}>
                {a}
              </div>
            ))}
          </div>
        )}

        {/* Sensor list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }} className="scrollbar-thin">
          <div style={{ fontSize: 10, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            Live Sensor Readings · {new Date(lastPulse).toLocaleTimeString("en-IN", { hour12: false })}
          </div>
          {sensors.map(s => {
            const depthPct = Math.min(100, (s.depth / s.thr) * 100);
            const barColor = depthPct > 90 ? "#ff3b5c" : depthPct > 70 ? "#ffb020" : "#22e39a";
            return (
              <div key={s.id} style={{
                marginBottom: 8, padding: "9px 11px",
                background: s.alarm ? "rgba(255,59,92,.08)" : "rgba(54,214,255,.05)",
                border: `1px solid ${s.alarm ? "rgba(255,59,92,.3)" : "rgba(80,170,255,.15)"}`,
                borderRadius: 9,
                transition: "background .5s, border-color .5s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#dbeaff" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "#7da3c9", marginTop: 1 }}>{s.id}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{s.depth.toFixed(2)} m</div>
                    <div style={{ fontSize: 10, color: "#7da3c9" }}>{s.flow.toFixed(1)} m³/s</div>
                  </div>
                </div>
                {/* depth bar */}
                <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${depthPct}%`,
                    background: barColor,
                    boxShadow: `0 0 6px ${barColor}`,
                    borderRadius: 3,
                    transition: "width .8s ease, background .5s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9.5, color: "#7da3c9" }}>
                  <span>{depthPct.toFixed(0)}% capacity</span>
                  {s.alarm && <span style={{ color: "#ff3b5c", fontWeight: 700 }}>⚠ OVERFLOW RISK</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
