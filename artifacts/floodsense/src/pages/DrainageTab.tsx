import { useEffect, useRef, useState } from "react";
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

const OUTFALLS: Record<string, [number, number]> = {
  OUT_COOUM, OUT_ADYAR, OUT_OKKIYAM, OUT_KOSAS,
};

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
  pl: L.Polyline;
  particle: L.CircleMarker;
  blockIcon: L.Marker | null;
  t: number; flowing: boolean;
};

export default function DrainageTab() {
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const edgesRef    = useRef<EdgeState[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [rainfall,  setRainfall]  = useState(80);
  const [stats,     setStats]     = useState({ stagnation: 28, risk: "Moderate", overflow: 14, blocked: "3 / 23" });
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 12);
    mapRef.current = map;
    addAreaMarkers(map);

    [["Cooum Mouth", OUT_COOUM], ["Adyar Estuary", OUT_ADYAR], ["Okkiyam Maduvu", OUT_OKKIYAM], ["Ennore Creek", OUT_KOSAS]].forEach(([nm, o]) => {
      L.circleMarker(o as [number, number], { radius: 14, color: "#0a4d8c", fillColor: "#1a8cff", fillOpacity: 0.5, weight: 2, className: "ripple-marker" }).addTo(map);
      L.marker(o as [number, number], {
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
      pl.on("click", () => { e.blocked = !e.blocked; e.baseBlocked = e.blocked; refreshFlow(); });
      return e;
    });

    edgesRef.current = edges;
    refreshFlow();

    intervalRef.current = setInterval(() => {
      edges.forEach(e => {
        if (!e.flowing) return;
        const speed = e.congested ? 0.012 : 0.035;
        e.t += speed; if (e.t >= 1) e.t = 0;
        const [a, b] = e.seg;
        e.particle.setLatLng([a[0] + (b[0] - a[0]) * e.t, a[1] + (b[1] - a[1]) * e.t]);
      });
    }, 80);

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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      map.remove();
    };
  }, []);

  function isStarved(node: string, visited = new Set<string>()): boolean {
    if (visited.has(node)) return true; visited.add(node);
    const incoming = edgesRef.current.filter(e => e.to === node);
    if (incoming.length === 0) return false;
    return incoming.every(e => e.blocked || isStarved(e.from, new Set(visited)));
  }

  function refreshFlow() {
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
  }

  useEffect(() => {
    if (!mapRef.current || edgesRef.current.length === 0) return;
    const heavyRain = rainfall > 200;
    edgesRef.current.forEach((e, idx) => {
      const highRisk = [11, 15, 3, 19].includes(idx);
      if (!e.baseBlocked) {
        e.blocked = heavyRain && highRisk;
        e.congested = e.baseCongested || (rainfall > 100 && [1, 7, 14, 20].includes(idx));
      }
    });
    refreshFlow();
    setStats({
      stagnation: Math.min(95, Math.round(20 + rainfall / 3.5)),
      risk: rainfall > 200 ? "CRITICAL" : rainfall > 120 ? "HIGH" : "Moderate",
      overflow: Math.round(8 + rainfall / 20),
      blocked: `${edgesRef.current.filter(e => e.blocked).length} / ${edgesRef.current.length}`,
    });
  }, [rainfall]);

  function handleDesilting() {
    edgesRef.current.forEach(e => { e.blocked = false; e.congested = e.baseCongested; });
    refreshFlow();
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

      <div className="float absolute top-3 left-3 z-[500] glass p-3" style={{ width: 310 }}>
        <div className="section-title mb-2">Drainage Stressor</div>
        <input type="range" min={0} max={300} value={rainfall}
          onChange={e => setRainfall(+e.target.value)}
          style={{ width: "100%", accentColor: "#00f0ff" }} />
        <div className="mt-2 text-center"><b style={{ color: "#00f0ff", fontSize: 16 }}>{rainfall} mm</b></div>
        <div className="flex gap-2 flex-wrap mt-3" style={{ fontSize: 12 }}>
          <span className="chip"><span className="dot" style={{ background: "#22e39a", width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 4 }}></span>Flowing</span>
          <span className="chip"><span className="dot" style={{ background: "#ffb020", width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 4 }}></span>Congested</span>
          <span className="chip"><span className="dot" style={{ background: "#ff3b5c", width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 4 }}></span>Blocked</span>
        </div>
        <hr style={{ borderColor: "rgba(80,170,255,.18)", margin: "10px 0" }} />
        <p style={{ fontSize: 11, color: "#7da3c9", lineHeight: 1.5 }}>
          Animated trunk drains carry stormwater from inland wards to Bay of Bengal. Click any drain segment to toggle blockage.
        </p>
        <button
          className="btn-neo mt-2"
          style={{ width: "100%", padding: "8px", borderRadius: 10, marginTop: 8 }}
          onClick={handleDesilting}
        >
          SIMULATE DESILTING
        </button>
        {simulated && (
          <div style={{ fontSize: 11, color: "#22e39a", marginTop: 6, textAlign: "center" }}>
            All blockages cleared — drains flowing
          </div>
        )}
      </div>

      <div className="float absolute top-3 right-3 z-[500] flex flex-col gap-2" style={{ width: 220 }}>
        <div className="kpi"><div className="label">Stagnation</div><div className="val" style={{ color: "#ffb020" }}>{stats.stagnation}%</div></div>
        <div className="kpi"><div className="label">Failure Risk</div><div className="val" style={{ color: rainfall > 200 ? "#ff3b5c" : "#ffb020" }}>{stats.risk}</div></div>
        <div className="kpi"><div className="label">Overflow Zones</div><div className="val" style={{ color: "#ff8a3d" }}>{stats.overflow}</div></div>
        <div className="kpi"><div className="label">Blocked Segments</div><div className="val" style={{ color: "#ff3b5c" }}>{stats.blocked}</div></div>
      </div>

      <div className="float absolute bottom-3 left-3 z-[500] glass p-2 text-[11.5px]">
        <b style={{ color: "#36d6ff" }}>LEGEND</b> &nbsp;
        <span style={{ color: "#22e39a" }}>━━</span> Flowing &nbsp;
        <span style={{ color: "#ffb020" }}>━━</span> Congested &nbsp;
        <span style={{ color: "#ff3b5c" }}>━━</span> Blocked
      </div>
    </div>
  );
}
