import { useEffect, useRef } from "react";
import L from "leaflet";
import { initBaseMap } from "../data/simulatedData";

interface Props {
  onMapReady?: (map: L.Map) => void;
  zoom?: number;
  className?: string;
}

export default function ChennaiMap({ onMapReady, zoom = 11, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = initBaseMap(containerRef.current, zoom);
    onMapReady?.(map);
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ background: "#02101e" }}
    />
  );
}
