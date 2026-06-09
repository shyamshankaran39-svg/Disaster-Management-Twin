export const chennaiCenter: [number, number] = [13.0827, 80.2707];

export const neighborhoods = [
  { name: "Velachery", pos: [12.9816, 80.2209] as [number, number] },
  { name: "Pallikaranai", pos: [12.9390, 80.2188] as [number, number] },
  { name: "Tambaram", pos: [12.9249, 80.1000] as [number, number] },
  { name: "Perungudi", pos: [12.9636, 80.2460] as [number, number] },
  { name: "Sholinganallur", pos: [12.9010, 80.2279] as [number, number] },
  { name: "Guindy", pos: [13.0069, 80.2205] as [number, number] },
  { name: "Porur", pos: [13.0358, 80.1571] as [number, number] },
  { name: "Ambattur", pos: [13.1143, 80.1548] as [number, number] },
  { name: "Anna Nagar", pos: [13.0850, 80.2101] as [number, number] },
  { name: "T Nagar", pos: [13.0418, 80.2341] as [number, number] },
  { name: "Adyar", pos: [13.0063, 80.2574] as [number, number] }
];

export const waterBodies = [
  { name: "Chembarambakkam", pos: [13.0369, 80.0680] as [number, number] },
  { name: "Puzhal", pos: [13.1875, 80.1614] as [number, number] },
  { name: "Poondi", pos: [13.4100, 80.0370] as [number, number] },
  { name: "Red Hills", pos: [13.1961, 80.1778] as [number, number] }
];

export const riverLevelData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  level: 1.5 + Math.sin(i / 3) * 0.5 + Math.random() * 0.2
}));

export const rainfallData = [
  { day: "Day 1", mm: 45 },
  { day: "Day 2", mm: 120 },
  { day: "Day 3", mm: 210 },
  { day: "Day 4", mm: 85 },
  { day: "Day 5", mm: 20 }
];
