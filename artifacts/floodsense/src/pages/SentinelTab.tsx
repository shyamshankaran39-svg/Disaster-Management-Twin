import { useState } from "react";
import ChennaiMap from "../components/ChennaiMap";

export default function SentinelTab() {
  const [timeline, setTimeline] = useState("24h");

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border shrink-0">
        <h2 className="text-xl font-semibold text-primary glow-text uppercase tracking-wider">Sentinel-1 Flood Detection</h2>
        <div className="flex gap-2 bg-background p-1 rounded border border-border">
          {["24h", "48h", "72h"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeline(t)}
              className={`px-4 py-1 text-sm rounded transition-colors ${
                timeline === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative flex">
          <div className="flex-1 relative border-r border-border">
            <div className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur px-3 py-1 text-sm font-medium rounded border border-border">
              BEFORE
            </div>
            <ChennaiMap />
          </div>
          <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur px-3 py-1 text-sm font-medium rounded border border-border text-primary">
              AFTER (Flooded Zones)
            </div>
            <ChennaiMap />
            {/* The actual blue polygon overlays would be added here via Leaflet in a real app */}
          </div>
        </div>
        
        <div className="w-80 glass-panel border-l border-border flex flex-col p-4 gap-6 overflow-y-auto shrink-0 z-10 relative">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-card border border-border rounded flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Flooded Area</span>
              <span className="text-3xl font-bold text-primary">847 <span className="text-base text-muted-foreground">km²</span></span>
            </div>
            <div className="p-4 bg-card border border-border rounded flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Water Spread</span>
              <span className="text-3xl font-bold text-amber-500">23%</span>
            </div>
            <div className="p-4 bg-card border border-border rounded flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Buildings Impacted</span>
              <span className="text-3xl font-bold text-destructive">12,450</span>
            </div>
            <div className="p-4 bg-card border border-border rounded flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Roads Impacted</span>
              <span className="text-3xl font-bold text-destructive">89 <span className="text-base text-muted-foreground">km</span></span>
            </div>
          </div>
          
          <div className="p-4 bg-primary/10 border border-primary/20 rounded mt-auto">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              AI ANALYSIS
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sentinel-1 SAR imagery indicates significant surface water expansion in the southern corridor. Urban density masking applied. High confidence (92%) in built-up area inundation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
