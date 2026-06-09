import ChennaiMap from "../components/ChennaiMap";

export default function ShelterTab() {
  return (
    <div className="w-full h-full relative">
      <ChennaiMap />
      
      <div className="absolute top-6 right-6 z-10 glass-panel border border-border rounded-lg w-96 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-border bg-card/80">
          <h2 className="text-lg font-bold text-primary uppercase tracking-wider glow-text">Shelter Recommendations</h2>
          <p className="text-xs text-muted-foreground mt-1">AI ranked safe zones based on elevation, capacity, and route viability.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {[
            { name: "Anna University Hall", type: "Institution", dist: "2.4 km", cap: 1500, occ: 45, score: 98, color: "text-emerald-500" },
            { name: "Velachery Corp School", type: "School", dist: "0.8 km", cap: 800, occ: 92, score: 85, color: "text-amber-500" },
            { name: "Guindy Community Ctr", type: "Community Hall", dist: "3.1 km", cap: 500, occ: 12, score: 91, color: "text-emerald-500" },
            { name: "Saidapet Temple Trust", type: "Temple", dist: "1.5 km", cap: 1200, occ: 88, score: 76, color: "text-orange-500" },
            { name: "Taramani Mahal", type: "Marriage Hall", dist: "4.0 km", cap: 2000, occ: 5, score: 95, color: "text-emerald-500" }
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 flex flex-col relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-bl">
                Rank #{i+1}
              </div>
              
              <div className="flex justify-between items-start mb-2 pr-12">
                <div className="font-semibold text-sm text-foreground">{s.name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Capacity</span>
                  <span className="text-xs font-mono">{s.occ}% of {s.cap}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Travel</span>
                  <span className="text-xs font-mono">{s.dist}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Suitability</span>
                  <span className={`text-xs font-bold ${s.color}`}>{s.score}/100</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Type</span>
                  <span className="text-xs truncate">{s.type}</span>
                </div>
              </div>
              
              <button className="w-full py-1.5 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors">
                Select & Route
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
