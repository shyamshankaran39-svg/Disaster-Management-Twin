import { useEffect, useRef } from "react";
import L from "leaflet";
import { initBaseMap, addFloodPolys } from "../data/simulatedData";

const SHELTERS = [
  { name: "Anna University Hall",    ll: [13.0116, 80.2347] as [number, number], type: "Institution",    cap: 1500, occ: 45,  score: 98, color: "#22e39a" },
  { name: "Velachery Corp School",   ll: [12.9780, 80.2180] as [number, number], type: "School",         cap: 800,  occ: 92,  score: 85, color: "#ffb020" },
  { name: "Guindy Community Centre", ll: [13.0090, 80.2050] as [number, number], type: "Community Hall", cap: 500,  occ: 12,  score: 91, color: "#22e39a" },
  { name: "Saidapet Temple Trust",   ll: [13.0220, 80.2280] as [number, number], type: "Temple",         cap: 1200, occ: 88,  score: 76, color: "#ff8a3d" },
  { name: "Taramani Mahal",          ll: [12.9870, 80.2420] as [number, number], type: "Marriage Hall",  cap: 2000, occ: 5,   score: 95, color: "#22e39a" },
  { name: "T Nagar Govt School",     ll: [13.0418, 80.2341] as [number, number], type: "School",         cap: 600,  occ: 70,  score: 79, color: "#ffb020" },
  { name: "Ambattur Kalyana Mahal",  ll: [13.0982, 80.1610] as [number, number], type: "Marriage Hall",  cap: 1800, occ: 20,  score: 88, color: "#22e39a" },
];

const typeColor: Record<string, string> = {
  "Institution":    "#1a8cff",
  "School":         "#36d6ff",
  "Community Hall": "#22e39a",
  "Temple":         "#ff8a3d",
  "Marriage Hall":  "#b266ff",
};

const EVAC_ROUTES: { from: [number,number]; to: [number,number] }[] = [
  { from: [12.9750, 80.2200], to: [13.0116, 80.2347] },
  { from: [12.9430, 80.2120], to: [12.9870, 80.2420] },
  { from: [12.9617, 80.2467], to: [13.0090, 80.2050] },
];

export default function ShelterTab() {
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 12);
    addFloodPolys(map, 1.0);

    EVAC_ROUTES.forEach(r => {
      L.polyline([r.from, r.to], {
        color: "#22e39a",
        weight: 3,
        opacity: 0.85,
        dashArray: "8 5",
        className: "flowline",
      }).addTo(map).bindPopup("<b>Evacuation Route</b><br>Clear · Travel ~15 min");
    });

    SHELTERS.forEach((s, i) => {
      const col = typeColor[s.type] || "#36d6ff";
      L.circleMarker(s.ll, {
        radius: 10 + (s.score / 20),
        color: col,
        fillColor: col,
        fillOpacity: 0.7,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`
          <b>${s.name}</b><br>
          Type: ${s.type}<br>
          Capacity: ${s.cap}<br>
          Occupancy: <b>${s.occ}%</b><br>
          Available: <b style="color:${s.occ < 80 ? "#22e39a" : "#ff3b5c"}">${s.occ < 80 ? "YES" : "NEAR FULL"}</b><br>
          AI Suitability: <b style="color:${col}">${s.score}/100</b>
        `);

      L.marker(s.ll, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:rgba(10,42,77,.9);color:${col};font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid ${col};white-space:nowrap;transform:translate(14px,-4px)">${s.name}</div>`,
          iconSize: [160, 14],
        }),
      }).addTo(map);
    });

    return () => { map.remove(); };
  }, []);

  const sorted = [...SHELTERS].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative">
        <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />
        <div className="absolute top-3 right-3 z-[500]">
          <span className="badge-ai">AI ROUTING</span>{" "}
          <span style={{ fontSize: 12, color: "#22e39a" }}>Evacuation optimised</span>
        </div>
      </div>

      <div className="w-80 flex flex-col border-l border-border shrink-0 overflow-y-auto scrollbar-thin"
        style={{ background: "rgba(6,26,46,.9)" }}>
        <div className="p-4 border-b border-border">
          <div className="section-title mb-1">Recommended Shelters</div>
          <p style={{ fontSize: 11, color: "#7da3c9" }}>AI-ranked safe zones by elevation, capacity &amp; route viability.</p>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {sorted.map((s, i) => {
            const col = typeColor[s.type] || "#36d6ff";
            return (
              <div key={s.name} className="glass p-3 rounded-xl" style={{ border: `1px solid ${col}33` }}>
                <div className="flex justify-between items-start mb-2">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#dbeaff" }}>{s.name}</div>
                  <span style={{ background: "rgba(0,240,255,.15)", color: "#00f0ff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                    #{i + 1}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11, marginBottom: 10 }}>
                  {[
                    { l: "Type",        v: s.type },
                    { l: "Capacity",    v: s.cap.toString() },
                    { l: "Occupancy",   v: s.occ + "%" },
                    { l: "Available",   v: s.occ < 80 ? "Yes" : "Near Full" },
                    { l: "SHG Cover",   v: "Active" },
                    { l: "Suitability", v: s.score + "/100" },
                  ].map(kv => (
                    <div key={kv.l}>
                      <div style={{ color: "#7da3c9", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{kv.l}</div>
                      <div style={{ color: kv.l === "Suitability" ? col : kv.l === "Available" ? (s.occ < 80 ? "#22e39a" : "#ff8a3d") : "#dbeaff", fontWeight: kv.l === "Suitability" ? 700 : 400 }}>{kv.v}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-neo" style={{ width: "100%", padding: "6px", fontSize: 12, borderRadius: 8 }}>
                  Select &amp; Route
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
