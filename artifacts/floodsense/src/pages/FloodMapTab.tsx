import { useState } from "react";
import ChennaiMap from "../components/ChennaiMap";

export default function FloodMapTab() {
  const [timeStep, setTimeStep] = useState(0);
  const steps = ["Current", "+6h", "+12h", "+24h", "+48h"];

  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      {/* Top Floating Stat Cards */}
      <div className="absolute top-6 right-6 z-10 flex gap-4">
        <div className="glass-panel border border-border rounded-lg p-4 w-48 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Simulated Time</span>
          <span className="text-2xl font-bold text-primary">{steps[timeStep]}</span>
        </div>
        <div className="glass-panel border border-border rounded-lg p-4 w-48 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Water Volume</span>
          <span className="text-2xl font-bold text-amber-500">{(12.4 + timeStep * 3.2).toFixed(1)} <span className="text-sm font-normal">M m³</span></span>
        </div>
      </div>

      {/* Left Legend */}
      <div className="absolute top-6 left-6 z-10 glass-panel border border-border rounded-lg p-4 w-48 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">Water Depth</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded bg-blue-900/50 border border-blue-500"></div> &lt; 0.5m
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded bg-blue-600/50 border border-blue-400"></div> 0.5m - 1.5m
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded bg-blue-400/50 border border-blue-300"></div> 1.5m - 2.5m
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded bg-cyan-300/50 border border-cyan-200"></div> &gt; 2.5m
        </div>
      </div>

      {/* Bottom Timeline Slider */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 glass-panel border border-primary/30 rounded-full p-4 w-[600px] flex flex-col gap-2 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
        <div className="flex justify-between w-full px-2">
          {steps.map((step, i) => (
            <div 
              key={step} 
              className={`text-xs font-bold cursor-pointer transition-colors ${timeStep === i ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTimeStep(i)}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="relative w-full h-2 bg-secondary rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.8)]"
            style={{ width: `${(timeStep / (steps.length - 1)) * 100}%` }}
          ></div>
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,1)]"
            style={{ left: `calc(${(timeStep / (steps.length - 1)) * 100}% - 8px)` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
