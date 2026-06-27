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
  timestamp: number; // epoch ms (backend returns numeric ms; used in chart math)
  tournamentId: string;
}

export const AnalyticsDashboard: React.FC<{ selectedRegime?: string | null }> = ({ selectedRegime = 'china/tang' }) => {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [trendData, setTrendData] = useState<Record<string, TrendData[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRegime) return;
    
    setLoading(true);
    // Fetch Radar
    fetch(`/api/analytics/radar/${encodeURIComponent(selectedRegime)}`)
      .then(res => res.json())
      .then(data => setRadarData(data))
      .catch(console.error);
      
    // Fetch Trends
    fetch('/api/analytics/trends')
      .then(res => res.json())
      .then(data => setTrendData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRegime]);

  const renderRadarChart = () => {
    if (!radarData) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px', padding: '40px 0' }}>Select a regime to load radar.</div>;

    const size = 300;
    const center = size / 2;
    const radius = 100;
    
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} /> Capability Radar
        </h3>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {/* Background Web */}
          {[0.2, 0.4, 0.6, 0.8, 1].map(scale => {
            const r = radius * scale;
            const pts = angles.map(a => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`).join(' ');
            return <polygon key={scale} points={pts} fill="none" stroke="var(--border-light)" strokeWidth="1" />;
          })}
          {/* Axes */}
          {angles.map((a, i) => (
            <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          ))}
          {/* Data Polygon */}
          <polygon 
            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} 
            fill="rgba(59, 130, 246, 0.2)" 
            stroke="var(--accent-blue)" 
            strokeWidth="2" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))', transition: 'all 0.5s ease' }} 
          />
          {/* Data Points */}
          <circle cx={p1.x} cy={p1.y} r="3" fill="#fff" />
          <circle cx={p2.x} cy={p2.y} r="3" fill="#fff" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="#fff" />
          
          {/* Labels */}
          <text x={center} y={20} fill="var(--text-muted)" fontSize="12" textAnchor="middle">Legality ({radarData.legality})</text>
          <text x={size - 10} y={center + 60} fill="var(--text-muted)" fontSize="12" textAnchor="end">Feasibility ({radarData.feasibility})</text>
          <text x={10} y={center + 60} fill="var(--text-muted)" fontSize="12" textAnchor="start">Resilience ({radarData.resilience})</text>
        </svg>
      </div>
    );
  };

  const renderTrendChart = () => {
    const regimes = Object.keys(trendData);
    if (regimes.length === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px', padding: '40px 0' }}>No historical match data found.</div>;

    const width = 600;
    const height = 250;
    const paddingX = 40;
    const paddingY = 40;

    // Find min/max timestamps for X-axis scaling
    let minT = Infinity;
    let maxT = -Infinity;
    regimes.forEach(r => {
      trendData[r].forEach(d => {
        if (d.timestamp < minT) minT = d.timestamp;
        if (d.timestamp > maxT) maxT = d.timestamp;
      });
    });

    if (minT === maxT) {
      maxT = minT + 1000; 
    }

    const scaleX = (t: number) => paddingX + ((t - minT) / (maxT - minT)) * (width - paddingX * 2);
    // Score Y-axis is always 0 to 10
    const scaleY = (score: number) => height - paddingY - (score / 10) * (height - paddingY * 2);

    const colors = ['var(--accent-blue)', 'var(--accent-emerald)', 'var(--accent-purple)', 'var(--accent-gold)'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={14} /> Capability Evolution Trend
        </h3>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Y Axis Guides */}
          {[0, 2, 4, 6, 8, 10].map(score => (
            <g key={score}>
              <line x1={paddingX} y1={scaleY(score)} x2={width - paddingX} y2={scaleY(score)} stroke="var(--border-light)" strokeDasharray="4 4" />
              <text x={paddingX - 10} y={scaleY(score) + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{score}</text>
            </g>
          ))}

          {/* Trend Lines */}
          {regimes.map((regime, i) => {
            const data = trendData[regime].sort((a, b) => a.timestamp - b.timestamp);
            const color = colors[i % colors.length];
            const d = data.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(pt.timestamp)} ${scaleY(pt.score)}`).join(' ');
            
            return (
              <g key={regime}>
                <path d={d} fill="none" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                {data.map((pt, idx) => (
                  <circle key={idx} cx={scaleX(pt.timestamp)} cy={scaleY(pt.score)} r="4" fill={color} />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {regimes.map((r, i) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: colors[i % colors.length] }}></div>
              {r}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card" style={{ padding: '32px', minHeight: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && !radarData ? <div style={{ color: 'var(--accent-blue)', animation: 'pulse 1.5s infinite' }}>Loading Metrics...</div> : renderRadarChart()}
      </div>
      
      <div className="glass-card" style={{ padding: '32px', minHeight: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && Object.keys(trendData).length === 0 ? <div style={{ color: 'var(--accent-emerald)', animation: 'pulse 1.5s infinite' }}>Aggregating History...</div> : renderTrendChart()}
      </div>
    </div>
  );
};
