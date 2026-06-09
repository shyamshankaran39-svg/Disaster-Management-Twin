import { useState, useEffect } from "react";
import ChennaiMap from "../components/ChennaiMap";
import { Play, Pause, FastForward } from "lucide-react";

export default function TimelinePlaybackTab() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = ["Current", "+6h", "+12h", "+24h", "+48h"];

  useEffect(() => {
    let interval: any;
    if (playing) {
      interval = setInterval(() => {
        setStep(s => {
          if (s >= steps.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [playing, steps.length]);

  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      {/* Top Right Stats */}
      <div className="absolute top-6 right-6 z-10 glass-panel border border-border rounded-lg p-5 w-80 flex flex-col gap-4 shadow-2xl transition-all duration-500">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <span className="text-sm text-muted-foreground uppercase">Time Step</span>
          <span className="text-xl font-bold text-primary font-mono">{steps[step]}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase">Flood Coverage</span>
          <span className="text-3xl font-bold text-foreground font-mono">{(5 + step * 12).toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase">Population Affected</span>
          <span className="text-2xl font-bold text-amber-500 font-mono">{(12000 + step * 45000).toLocaleString()}</span>
        </div>

        <div className={`mt-2 py-2 px-3 rounded text-center text-xs font-bold uppercase tracking-widest ${step > 2 ? 'bg-destructive/20 text-destructive border border-destructive/50 animate-pulse' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'}`}>
          {step > 2 ? "Urgent Evacuation Required" : "Monitoring Phase"}
        </div>
      </div>

      {/* Bottom Playback Control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 glass-panel border border-primary/30 rounded-xl p-4 w-[700px] flex flex-col gap-4 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (step >= steps.length - 1) setStep(0);
              setPlaying(!playing);
            }}
            className="w-12 h-12 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between w-full px-2 mb-2">
              {steps.map((s, i) => (
                <div 
                  key={s} 
                  className={`text-[10px] uppercase font-bold cursor-pointer transition-colors ${step === i ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => { setStep(i); setPlaying(false); }}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="relative w-full h-2.5 bg-secondary rounded-full cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-[2000ms] ease-linear shadow-[0_0_10px_rgba(14,165,233,0.8)]"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full transition-all duration-[2000ms] ease-linear shadow-[0_0_10px_rgba(14,165,233,1)]"
                style={{ left: `calc(${(step / (steps.length - 1)) * 100}% - 8px)` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
