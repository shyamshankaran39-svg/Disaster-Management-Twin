import { useState } from "react";
import ChennaiMap from "../components/ChennaiMap";

export default function RiskScoringTab() {
  const [rainfall, setRainfall] = useState(150);

  const riskLevel = rainfall < 100 ? "Low" : rainfall < 200 ? "Moderate" : rainfall < 250 ? "High" : "Critical";
  const riskColor = rainfall < 100 ? "text-emerald-500" : rainfall < 200 ? "text-amber-500" : rainfall < 250 ? "text-orange-500" : "text-destructive";

  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      {/* Top Floating Control Panel */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass-panel border border-border rounded-lg p-4 w-96 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-primary glow-text uppercase tracking-wider text-center">AI Risk Scoring</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Rainfall Simulator</span>
            <span className="font-mono font-bold text-primary">{rainfall} mm</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="300" 
            value={rainfall} 
            onChange={(e) => setRainfall(Number(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>150</span>
            <span>300</span>
          </div>
        </div>
      </div>

      {/* Right Stats Panel */}
      <div className="absolute top-6 right-6 z-10 glass-panel border border-border rounded-lg p-4 w-64 flex flex-col gap-4">
        <div className="p-3 bg-card border border-border rounded flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">City-wide Flood Risk</span>
          <span className={`text-2xl font-bold ${riskColor} uppercase`}>{riskLevel}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">Avg Depth</span>
            <span className="text-xl font-bold text-primary">{(rainfall * 0.012).toFixed(1)}m</span>
          </div>
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">AI Conf.</span>
            <span className="text-xl font-bold text-emerald-500">94%</span>
          </div>
        </div>
        <div className="p-3 bg-card border border-border rounded flex flex-col">
          <span className="text-xs text-muted-foreground">Population at Risk</span>
          <span className="text-2xl font-bold text-destructive">{Math.floor(rainfall * 1250).toLocaleString()}</span>
        </div>
      </div>

      {/* Bottom Left Risk Table */}
      <div className="absolute bottom-6 left-6 z-10 glass-panel border border-border rounded-lg p-4 w-80 max-h-[300px] overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Hotspot Risk Predictions</h3>
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground sticky top-0 bg-background/90 backdrop-blur z-10">
              <tr>
                <th className="pb-2">Region</th>
                <th className="pb-2">Risk</th>
                <th className="pb-2">Depth</th>
              </tr>
            </thead>
            <tbody>
              {["Velachery", "Pallikaranai", "Tambaram", "Guindy", "Adyar"].map((region, i) => {
                const regionalRisk = Math.min(100, (rainfall / 300) * 100 + (Math.random() * 20 - 10));
                const c = regionalRisk > 80 ? "text-destructive" : regionalRisk > 50 ? "text-amber-500" : "text-emerald-500";
                return (
                  <tr key={region} className="border-b border-border/50 last:border-0">
                    <td className="py-2 text-foreground">{region}</td>
                    <td className={`py-2 font-mono font-bold ${c}`}>{regionalRisk.toFixed(0)}%</td>
                    <td className="py-2 text-muted-foreground">{(regionalRisk * 0.025).toFixed(1)}m</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
