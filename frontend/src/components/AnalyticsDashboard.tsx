import React, { useEffect, useState } from 'react';
import { Activity, BarChart2 } from 'lucide-react';

interface RadarData {
  regime: string;
  legality: number;
  feasibility: number;
  resilience: number;
  baseScore: number;
}

interface TrendData {
  score: number;
  timestamp: string;
  tournamentId: string;
}

export const AnalyticsDashboard: React.FC<{ selectedRegime: string | null }> = ({ selectedRegime }) => {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [trendData, setTrendData] = useState<Record<string, TrendData[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRegime) return;
    
    setLoading(true);
    // Fetch Radar
    fetch(`http://localhost:3001/api/analytics/radar/${encodeURIComponent(selectedRegime)}`)
      .then(res => res.json())
      .then(data => setRadarData(data))
      .catch(console.error);
      
    // Fetch Trends
    fetch('http://localhost:3001/api/analytics/trends')
      .then(res => res.json())
      .then(data => setTrendData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRegime]);

  const renderRadarChart = () => {
    if (!radarData) return <div className="text-white/30 text-center text-sm py-10">Select a regime to load radar.</div>;

    const size = 200;
    const center = size / 2;
    const radius = 80;
    
    // 3 axes: top (legality), bottom-right (feasibility), bottom-left (resilience)
    const angles = [
      -Math.PI / 2,         // Top
      Math.PI / 6,          // Bottom Right
      Math.PI * 5 / 6       // Bottom Left
    ];

    const getPoint = (val: number, angleIndex: number) => {
      const r = (val / 10) * radius;
      return {
        x: center + r * Math.cos(angles[angleIndex]),
        y: center + r * Math.sin(angles[angleIndex])
      };
    };

    const p1 = getPoint(radarData.legality, 0);
    const p2 = getPoint(radarData.feasibility, 1);
    const p3 = getPoint(radarData.resilience, 2);

    return (
      <div className="flex flex-col items-center">
        <h3 className="text-xs font-bold text-[var(--accent-cyan)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={14} /> Capability Radar
        </h3>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Web */}
          {[0.2, 0.4, 0.6, 0.8, 1].map(scale => {
            const r = radius * scale;
            const pts = angles.map(a => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`).join(' ');
            return <polygon key={scale} points={pts} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
          })}
          {/* Axes */}
          {angles.map((a, i) => (
            <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          ))}
          {/* Data Polygon */}
          <polygon 
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} 
            fill="rgba(0, 240, 255, 0.2)" 
            stroke="var(--accent-cyan)" 
            strokeWidth="2" 
            className="drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] transition-all duration-500" 
          />
          {/* Data Points */}
          <circle cx={p1.x} cy={p1.y} r="3" fill="#fff" />
          <circle cx={p2.x} cy={p2.y} r="3" fill="#fff" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="#fff" />
          
          {/* Labels */}
          <text x={center} y={10} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Legality ({radarData.legality})</text>
          <text x={size} y={center + 40} fill="var(--text-secondary)" fontSize="10" textAnchor="end">Feasibility ({radarData.feasibility})</text>
          <text x={0} y={center + 40} fill="var(--text-secondary)" fontSize="10" textAnchor="start">Resilience ({radarData.resilience})</text>
        </svg>
      </div>
    );
  };

  const renderTrendChart = () => {
    if (!selectedRegime || !trendData[selectedRegime]) return <div className="text-white/30 text-center text-sm py-10">No match data.</div>;
    
    const data = trendData[selectedRegime];
    const width = 300;
    const height = 150;
    const padding = 20;

    const maxScore = 10;
    const minScore = 0;

    const points = data.map((d, i) => {
      const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center">
        <h3 className="text-xs font-bold text-[#00ff9d] uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart2 size={14} /> Tournament Score Trends
        </h3>
        <svg width={width} height={height} className="overflow-visible border-b border-l border-white/10">
          {/* Grid lines */}
          {[0, 2.5, 5, 7.5, 10].map(val => {
            const y = height - padding - ((val - minScore) / (maxScore - minScore)) * (height - padding * 2);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" />
                <text x={padding - 5} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">{val}</text>
              </g>
            );
          })}
          
          {/* Line */}
          {data.length > 1 && (
            <polyline 
              points={points} 
              fill="none" 
              stroke="#00ff9d" 
              strokeWidth="2" 
              className="drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]"
            />
          )}

          {/* Dots */}
          {data.map((d, i) => {
            const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#00ff9d" />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 flex items-start justify-around gap-8 mt-6">
      {loading ? (
        <div className="animate-pulse text-white/50 text-sm">Gathering analytics...</div>
      ) : (
        <>
          {renderRadarChart()}
          {renderTrendChart()}
        </>
      )}
    </div>
  );
};
