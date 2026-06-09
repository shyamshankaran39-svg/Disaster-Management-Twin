import ChennaiMap from "../components/ChennaiMap";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { riverLevelData, rainfallData } from "../data/simulatedData";

export default function FloodHubTab() {
  return (
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        <ChennaiMap />
      </div>
      <div className="w-96 glass-panel border-l border-border flex flex-col p-4 gap-6 overflow-y-auto shrink-0 z-10 relative bg-background">
        <h2 className="text-xl font-semibold text-primary glow-text uppercase tracking-wider">Flood Hub Analysis</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-card border border-border rounded">
            <div className="text-xs text-muted-foreground">Flood Depth</div>
            <div className="text-2xl font-bold text-destructive">2.4m</div>
          </div>
          <div className="p-3 bg-card border border-border rounded">
            <div className="text-xs text-muted-foreground">Risk Score</div>
            <div className="text-2xl font-bold text-amber-500">87/100</div>
          </div>
          <div className="p-3 bg-card border border-border rounded">
            <div className="text-xs text-muted-foreground">Pop Exposed</div>
            <div className="text-2xl font-bold text-primary">142,000</div>
          </div>
          <div className="p-3 bg-card border border-border rounded">
            <div className="text-xs text-muted-foreground">Villages Affected</div>
            <div className="text-2xl font-bold text-primary">34</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">River Level</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riverLevelData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#050d1a', borderColor: '#1e293b' }} />
                <Line type="monotone" dataKey="level" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Rainfall (5-Day)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainfallData}>
                <XAxis dataKey="day" tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#050d1a', borderColor: '#1e293b' }} />
                <Bar dataKey="mm" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 bg-primary/10 border border-primary/20 rounded mt-auto">
          <h3 className="text-sm font-semibold text-primary mb-2">AI SUMMARY</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Critical levels breached at Velachery and Pallikaranai. Suggest immediate evacuation of low-lying zones. Inflow from Chembarambakkam is accelerating.
          </p>
        </div>
      </div>
    </div>
  );
}
