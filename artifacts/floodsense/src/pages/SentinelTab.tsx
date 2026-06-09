import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { initBaseMap, addAreaMarkers, addWaterMarkers, addFloodPolys } from "../data/simulatedData";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
};

const sarData = [
  { area: "Pallikaranai", pre: 12, post: 34 },
  { area: "Velachery",    pre: 8,  post: 26 },
  { area: "Perungudi",    pre: 6,  post: 18 },
  { area: "Sholinganallur",pre:4,  post: 14 },
  { area: "Tambaram",     pre: 3,  post: 10 },
];

export default function SentinelTab() {
  const [timeline, setTimeline] = useState("24h");
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!beforeRef.current || !afterRef.current) return;

    const before = initBaseMap(beforeRef.current, 11);
    addAreaMarkers(before);
    addWaterMarkers(before);

    const after = initBaseMap(afterRef.current, 11);
    addAreaMarkers(after, true);
    addWaterMarkers(after);
    const scale = timeline === "24h" ? 1.0 : timeline === "48h" ? 1.3 : 1.7;
    addFloodPolys(after, scale);

    return () => { before.remove(); after.remove(); };
  }, [timeline]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border shrink-0" style={{ background: "rgba(6,26,46,.85)" }}>
        <div className="section-title mb-0">Sentinel-1 SAR Flood Detection</div>
        <div className="flex gap-2 ml-auto">
          {["24h","48h","72h"].map(t => (
            <button
              key={t}
              onClick={() => setTimeline(t)}
              className={`chip cursor-pointer text-xs ${t === timeline ? "on" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex">
          <div className="flex-1 relative border-r border-border">
            <div
              className="absolute top-3 left-3 z-[500] glass px-3 py-1 text-xs font-semibold rounded"
              style={{ color: "#7da3c9", zIndex: 500 }}
            >
              SAR · PRE-FLOOD
            </div>
            <div ref={beforeRef} className="absolute inset-0" style={{ background: "#02101e" }} />
          </div>
          <div className="flex-1 relative">
            <div
              className="absolute top-3 left-3 z-[500] px-3 py-1 text-xs font-semibold rounded"
              style={{ background: "rgba(26,140,255,.25)", color: "#36d6ff", border: "1px solid #36d6ff55", zIndex: 500 }}
            >
              SAR · POST-FLOOD · {timeline}
            </div>
            <div ref={afterRef} className="absolute inset-0" style={{ background: "#02101e" }} />
          </div>
        </div>

        <div className="w-72 flex flex-col gap-3 p-4 border-l border-border overflow-y-auto scrollbar-thin shrink-0" style={{ background: "rgba(6,26,46,.85)" }}>
          <div className="section-title">SAR Metrics</div>

          {[
            { label: "Flooded Area",       val: "187 km²",  color: "#36d6ff" },
            { label: "Water Spread",       val: "+38%",     color: "#ffb020" },
            { label: "Buildings Impacted", val: "12,408",   color: "#ff3b5c" },
            { label: "Roads Impacted",     val: "214 km",   color: "#ff3b5c" },
          ].map(k => (
            <div key={k.label} className="kpi">
              <div className="label">{k.label}</div>
              <div className="val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}

          <div className="section-title mt-2">Flood Area Comparison</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sarData}>
                <XAxis dataKey="area" tick={{ fill: "#7da3c9", fontSize: 9 }} />
                <YAxis tick={{ fill: "#7da3c9", fontSize: 9 }} />
                <Tooltip {...CHART_STYLE} />
                <Bar dataKey="pre"  name="Pre km²"  fill="#3a587a" radius={[3,3,0,0]} />
                <Bar dataKey="post" name="Post km²" fill="#00f0ff" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass p-3 mt-1" style={{ background: "rgba(0,240,255,.06)" }}>
            <span className="badge-ai">AI ANALYSIS</span>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "#dbeaff" }}>
              Backscatter delta confirms standing water across Pallikaranai marsh.
              U-Net segmentation IoU = <b style={{ color: "#00f0ff" }}>0.91</b>.
              Inundation persisted from cyclone-driven rainfall bands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
