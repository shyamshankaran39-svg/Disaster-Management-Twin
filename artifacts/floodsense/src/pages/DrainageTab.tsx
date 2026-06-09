import { useState } from "react";
import ChennaiMap from "../components/ChennaiMap";

export default function DrainageTab() {
  const [rainfall, setRainfall] = useState(50);

  const capacity = Math.max(0, 100 - (rainfall / 300) * 80);
  const blocked = Math.min(100, (rainfall / 300) * 60 + 10);
  const risk = rainfall > 200 ? "CRITICAL" : rainfall > 100 ? "HIGH" : "MODERATE";

  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      {/* Top Floating Stats */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex gap-4">
        <div className="glass-panel border border-border rounded-lg p-4 w-48 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Capacity</span>
          <div className="text-2xl font-bold font-mono text-primary">{capacity.toFixed(1)}%</div>
        </div>
        <div className="glass-panel border border-border rounded-lg p-4 w-48 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Blockage Level</span>
          <div className="text-2xl font-bold font-mono text-destructive">{blocked.toFixed(1)}%</div>
        </div>
        <div className="glass-panel border border-border rounded-lg p-4 w-48 flex flex-col items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Network Risk</span>
          <div className={`text-2xl font-bold uppercase ${rainfall > 150 ? 'text-destructive animate-pulse' : 'text-amber-500'}`}>{risk}</div>
        </div>
      </div>

      {/* Simulator Panel */}
      <div className="absolute bottom-6 left-6 z-10 glass-panel border border-border rounded-lg p-5 w-80">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Stormwater Simulator</h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Rainfall Load</span>
            <span className="font-mono text-foreground">{rainfall} mm</span>
          </div>
          <input 
            type="range" min="0" max="300" value={rainfall}
            onChange={e => setRainfall(Number(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Action Queue */}
      <div className="absolute top-6 right-6 z-10 glass-panel border border-border rounded-lg w-80 flex flex-col overflow-hidden max-h-[calc(100%-3rem)]">
        <div className="p-4 border-b border-border bg-card/80">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Action Queue</h3>
        </div>
        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {[
            { id: "S-142", loc: "T Nagar Drain 4", issue: "Severe Blockage", prio: "P1" },
            { id: "S-089", loc: "Velachery Main", issue: "Capacity Exceeded", prio: "P1" },
            { id: "S-201", loc: "Adyar Estuary", issue: "Backflow Detected", prio: "P2" },
            { id: "S-045", loc: "Guindy Estate", issue: "Silt Accumulation", prio: "P3" }
          ].map(task => (
            <div key={task.id} className="p-3 bg-card border border-border rounded flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-primary">{task.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${task.prio === 'P1' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>
                  {task.prio}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground">{task.loc}</div>
              <div className="text-xs text-muted-foreground">{task.issue}</div>
              <button className="mt-1 text-xs w-full py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors uppercase tracking-wider">
                Dispatch Team
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
