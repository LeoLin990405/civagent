import React from 'react';
import { Layers, Activity, History, ShieldAlert, Cpu, Globe, Trophy } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Empire Overview', icon: <Layers size={20} /> },
    { id: 'regimes', label: 'Regime Browser', icon: <Globe size={20} /> },
    { id: 'analytics', label: 'Analytics Dashboard', icon: <Activity size={20} /> },
    { id: 'memory', label: 'Episodic Memory', icon: <History size={20} /> },
    { id: 'veto', label: 'Constitution', icon: <ShieldAlert size={20} /> },
    { id: 'live', label: 'Live Court', icon: <Cpu size={20} /> },
    { id: 'rankings', label: 'Rankings', icon: <Trophy size={20} /> },
  ];

  return (
    <div className="sidebar" style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
        <Cpu size={28} className="text-gradient" />
        <div>
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '20px' }}>CivAgent</h2>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px' }}>V6.0 KERNEL</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              width: '100%',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              borderLeft: activeTab === tab.id ? '3px solid var(--accent-blue)' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            {React.cloneElement(tab.icon as React.ReactElement<{ color?: string }>, {
              color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)'
            })}
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Status</span>
          <span style={{ color: 'var(--accent-emerald)' }}>● ONLINE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Server</span>
          <span>localhost:3001</span>
        </div>
      </div>
    </div>
  );
};
