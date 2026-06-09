import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { initBaseMap, addWaterMarkers, areas, riskColor } from "../data/simulatedData";

export default function RiskScoringTab() {
  const mapDivRef     = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const circlesRef    = useRef<L.CircleMarker[]>([]);
  const [rainfall, setRainfall] = useState(100);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addWaterMarkers(map);

    circlesRef.current = areas.map(a =>
      L.circle(a.ll, {
        radius: 1200,
        color: riskColor(a.risk),
        fillColor: riskColor(a.risk),
        fillOpacity: 0.35,
        weight: 1,
      })
        .addTo(map)
        .bindPopup(`<b>${a.name}</b><br>Risk: ${(a.risk * 100).toFixed(0)}%`)
    );

    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || circlesRef.current.length === 0) return;
    const factor = Math.min(1.4, rainfall / 120);
    circlesRef.current.forEach((c, i) => {
      const r = Math.min(1, areas[i].risk * factor);
      c.setStyle({ color: riskColor(r), fillColor: riskColor(r), fillOpacity: 0.25 + r * 0.4 });
      c.setRadius(800 + r * 1800);
      c.bindPopup(`<b>${areas[i].name}</b><br>Risk: ${(r * 100).toFixed(0)}%<br>Depth: ${(r * 2.5).toFixed(1)} m`);
    });
  }, [rainfall, ready]);

  const prob  = Math.min(99, Math.round(40 + rainfall / 3));
  const depth = (0.3 + rainfall / 120).toFixed(1);
  const pop   = Math.round(60 + rainfall * 2.4);
  const conf  = Math.min(98, 80 + Math.floor(rainfall / 20));

  const regionRisks = areas.slice(0, 6).map(a => ({
    name: a.name,
    risk: Math.min(1, a.risk * Math.min(1.4, rainfall / 120)),
  }));

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

      <div className="float absolute top-3 left-3 z-[500] glass p-3" style={{ width: 320 }}>
        <div className="section-title mb-2">Rainfall Simulator</div>
        <input
          type="range" min={0} max={300} value={rainfall}
          onChange={e => setRainfall(+e.target.value)}
          style={{ width: "100%", accentColor: "#00f0ff" }}
        />
        <div className="flex justify-between text-[11px] mt-1" style={{ color: "#7da3c9" }}>
          <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300 mm</span>
        </div>
        <div className="text-center mt-2">
          <b style={{ color: "#00f0ff", fontSize: 18 }}>{rainfall} mm</b>
        </div>
      </div>

      <div className="float absolute top-3 right-3 z-[500] flex flex-col gap-2" style={{ width: 240 }}>
        <div className="kpi"><div className="label">Flood Probability</div><div className="val" style={{ color: prob > 80 ? "#ff3b5c" : "#00f0ff" }}>{prob}%</div></div>
        <div className="kpi"><div className="label">Avg Water Depth</div><div className="val" style={{ color: "#00f0ff" }}>{depth} m</div></div>
        <div className="kpi"><div className="label">Population at Risk</div><div className="val" style={{ color: "#ff8a3d" }}>{pop}k</div></div>
        <div className="kpi"><div className="label">AI Confidence</div><div className="val" style={{ color: "#22e39a" }}>{conf}%</div></div>
      </div>

      <div className="float absolute bottom-3 left-3 z-[500] glass p-3" style={{ fontSize: 12 }}>
        <div className="section-title mb-2">Hotspot Risk Table</div>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#7da3c9", borderBottom: "1px solid rgba(80,170,255,.15)" }}>
              <th style={{ textAlign: "left", padding: "4px 6px" }}>Region</th>
              <th style={{ padding: "4px 6px" }}>Risk</th>
              <th style={{ padding: "4px 6px" }}>Depth</th>
              <th style={{ padding: "4px 6px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {regionRisks.map(r => (
              <tr key={r.name} style={{ borderBottom: "1px solid rgba(80,170,255,.07)" }}>
                <td style={{ padding: "5px 6px", color: "#dbeaff" }}>{r.name}</td>
                <td style={{ padding: "5px 6px", color: riskColor(r.risk), fontWeight: 700, textAlign: "center" }}>{(r.risk * 100).toFixed(0)}%</td>
                <td style={{ padding: "5px 6px", color: "#7da3c9", textAlign: "center" }}>{(r.risk * 2.5).toFixed(1)}m</td>
                <td style={{ padding: "5px 6px", textAlign: "center" }}>
                  <span style={{
                    background: riskColor(r.risk) + "22",
                    color: riskColor(r.risk),
                    padding: "2px 7px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    border: `1px solid ${riskColor(r.risk)}55`,
                  }}>
                    {r.risk > 0.85 ? "EVACUATE" : r.risk > 0.65 ? "WARNING" : r.risk > 0.45 ? "WATCH" : "SAFE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="float absolute bottom-3 right-3 z-[500] glass p-2" style={{ fontSize: 12 }}>
        <b style={{ color: "#36d6ff" }}>HEATMAP LEGEND</b>&nbsp;
        <span className="chip" style={{ background: "#1a7a3a" }}>Low</span>&nbsp;
        <span className="chip" style={{ background: "#b58800" }}>Med</span>&nbsp;
        <span className="chip" style={{ background: "#d2691e" }}>High</span>&nbsp;
        <span className="chip" style={{ background: "#b22234" }}>Severe</span>
      </div>
    </div>
  );
}
