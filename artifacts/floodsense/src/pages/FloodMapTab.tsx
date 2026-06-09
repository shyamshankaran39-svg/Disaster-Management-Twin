import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { initBaseMap, addAreaMarkers, addWaterMarkers, areas, riskColor } from "../data/simulatedData";

const STEPS = ["Now", "+6h", "+12h", "+24h", "+48h"];

const STEP_DATA = [
  { depth: "1.4", velocity: "0.8", risk: "8.2", pop: "320k" },
  { depth: "1.8", velocity: "1.1", risk: "8.8", pop: "410k" },
  { depth: "2.3", velocity: "1.4", risk: "9.1", pop: "530k" },
  { depth: "2.9", velocity: "1.7", risk: "9.5", pop: "710k" },
  { depth: "3.4", velocity: "2.0", risk: "9.8", pop: "940k" },
];

function buildPolys(map: L.Map, stepIdx: number): L.Polygon[] {
  const scale = 1 + stepIdx * 0.22;
  const hotspots: { center: [number, number]; risk: number; fromStep: number }[] = [
    { center: [12.9750, 80.2200], risk: 0.92, fromStep: 0 },
    { center: [12.9430, 80.2120], risk: 0.96, fromStep: 0 },
    { center: [13.0067, 80.2206], risk: 0.55, fromStep: 1 },
    { center: [12.9617, 80.2467], risk: 0.81, fromStep: 1 },
    { center: [13.0067, 80.2570], risk: 0.68, fromStep: 2 },
    { center: [12.9010, 80.2279], risk: 0.74, fromStep: 2 },
    { center: [12.9229, 80.1275], risk: 0.78, fromStep: 3 },
    { center: [13.0418, 80.2341], risk: 0.49, fromStep: 4 },
  ];

  return hotspots
    .filter(h => stepIdx >= h.fromStep)
    .map(h => {
      const [lat, lng] = h.center;
      const sz = 0.017 * scale * h.risk;
      const opacity = Math.min(0.45, 0.12 + (stepIdx - h.fromStep) * 0.08 + h.risk * 0.12);
      return L.polygon(
        [
          [lat - sz, lng - sz * 1.5],
          [lat + sz, lng - sz],
          [lat + sz * 1.3, lng + sz * 1.3],
          [lat - sz * 0.5, lng + sz * 1.8],
          [lat - sz * 1.5, lng + sz * 0.5],
        ] as [number, number][],
        { color: "#1a8cff", fillColor: "#00f0ff", fillOpacity: opacity, weight: 1.5 }
      )
        .addTo(map)
        .bindPopup(`<b>Flood Zone</b><br>Depth: ${(h.risk * 2.8 * scale).toFixed(1)} m`);
    });
}

export default function FloodMapTab() {
  const mapDivRef  = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<L.Map | null>(null);
  const polysRef   = useRef<L.Polygon[]>([]);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addAreaMarkers(map, true);
    addWaterMarkers(map);
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    polysRef.current.forEach(p => mapRef.current!.removeLayer(p));
    polysRef.current = buildPolys(mapRef.current, step);
  }, [step, ready]);

  const d = STEP_DATA[step];

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

      <div className="float absolute top-3 right-3 z-[500]">
        <span className="badge-ai">LIVE</span>{" "}
        <span style={{ color: "#22e39a", fontSize: 12 }}>● Streaming flood progression</span>
      </div>

      <div className="float absolute bottom-3 start-0 left-3 z-[500] flex gap-2">
        {[
          { label: "Water Depth",   val: d.depth + " m", color: "#36d6ff" },
          { label: "Flow Velocity", val: d.velocity + " m/s", color: "#00f0ff" },
          { label: "Risk Score",    val: d.risk, color: "#ffb020" },
          { label: "Pop. Exposed",  val: d.pop, color: "#ff3b5c" },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="label">{k.label}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="float absolute bottom-20 left-1/2 z-[500] glass p-3 rounded-xl" style={{ transform: "translateX(-50%)", width: 500 }}>
        <div className="section-title mb-2">Flood Timeline</div>
        <input
          type="range" min={0} max={4} step={1} value={step}
          onChange={e => setStep(+e.target.value)}
          style={{ width: "100%", accentColor: "#00f0ff" }}
        />
        <div className="flex justify-between mt-1 text-[11px]" style={{ color: "#7da3c9" }}>
          {STEPS.map(s => <span key={s}>{s}</span>)}
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {["Flood Polygons","Hotspots","Population"].map(label => (
            <span key={label} className="chip on text-[11px] cursor-pointer">{label}</span>
          ))}
        </div>
      </div>

      <div className="float absolute top-3 left-3 z-[500] glass p-3 text-[11.5px]" style={{ minWidth: 140 }}>
        <b style={{ color: "#36d6ff" }}>DEPTH LEGEND</b>
        <div className="flex items-center gap-2 mt-2"><span style={{ width: 16, height: 12, background: "#1a3a5c", display: "inline-block", borderRadius: 3 }}></span> &lt; 0.5m</div>
        <div className="flex items-center gap-2 mt-1"><span style={{ width: 16, height: 12, background: "#1a8cff66", display: "inline-block", borderRadius: 3 }}></span> 0.5–1.5m</div>
        <div className="flex items-center gap-2 mt-1"><span style={{ width: 16, height: 12, background: "#00f0ff66", display: "inline-block", borderRadius: 3 }}></span> 1.5–2.5m</div>
        <div className="flex items-center gap-2 mt-1"><span style={{ width: 16, height: 12, background: "#00f0ffaa", display: "inline-block", borderRadius: 3 }}></span> &gt; 2.5m</div>
      </div>
    </div>
  );
}
