import { useState } from "react";
import ChennaiMap from "../components/ChennaiMap";

export default function WaterArrivalTab() {
  const [running, setRunning] = useState(false);

  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      {/* Simulation Control */}
      <div className="absolute top-6 left-6 z-10 glass-panel border border-border rounded-lg p-5 w-80 flex flex-col gap-4 shadow-lg">
        <h2 className="text-lg font-bold text-primary uppercase tracking-wider glow-text border-b border-border pb-2">Water Arrival Prediction</h2>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI model simulates downstream flow velocity based on topography, drainage capacity, and current water levels.
        </p>

        <button 
          onClick={() => setRunning(!running)}
          className={`w-full py-3 rounded font-bold uppercase tracking-widest transition-all ${
            running 
            ? "bg-destructive/20 text-destructive border border-destructive/50 animate-pulse" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {running ? "HALT SIMULATION" : "RUN AI RELEASE SIMULATION"}
        </button>

        {running && (
          <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-4">
            <div className="p-3 bg-card border border-border rounded flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase">Est. Travel Time</span>
              <span className="font-mono font-bold text-amber-500">4h 20m</span>
            </div>
            <div className="p-3 bg-card border border-border rounded flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Recommended Release</span>
              <span className="font-mono font-bold text-primary text-lg">1200 cusecs</span>
              <span className="text-xs text-emerald-500">Safe Window: 4 AM - 8 AM</span>
            </div>
            <div className="p-3 bg-card border border-destructive/30 rounded flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Downstream Impact</span>
              <span className="text-sm font-bold text-destructive">Severe in Adyar Estuary</span>
            </div>
          </div>
        )}
      </div>

      {/* Static visual overlay of routes (mocking leaflet polylines with absolute positioned SVGs for demo effect if needed, but per instructions we just show a dashboard) */}
      <div className="absolute top-6 right-6 z-10 glass-panel border border-border rounded-lg p-4 w-64">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Active Flow Paths</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-dashed border-primary animate-flow"></div>
            <span className="text-xs text-muted-foreground">Chembarambakkam → Adyar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-dashed border-amber-500 animate-flow"></div>
            <span className="text-xs text-muted-foreground">Poondi → Puzhal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
