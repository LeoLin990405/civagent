import React from 'react';
import { TAB_TITLES } from './tabs';
import { isDemoMode } from '../../demo/demoMode';
import { Layers, Activity, History, ShieldAlert, Cpu, Globe, Trophy, Archive, Rocket, BookOpen, Edit3 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', icon: <Layers size={20} /> },
    { id: 'launch', icon: <Rocket size={20} /> },
    { id: 'regimes', icon: <Globe size={20} /> },
    { id: 'analytics', icon: <Activity size={20} /> },
    { id: 'memory', icon: <History size={20} /> },
    { id: 'editor', icon: <Edit3 size={20} /> },
    { id: 'skills', icon: <BookOpen size={20} /> },
    { id: 'veto', icon: <ShieldAlert size={20} /> },
    { id: 'archive', icon: <Archive size={20} /> },
    { id: 'live', icon: <Cpu size={20} /> },
    { id: 'rankings', icon: <Trophy size={20} /> },
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
            <span className="nav-label">
              <span className="nav-label-zh">{TAB_TITLES[tab.id].zh}</span>
              <span className="nav-label-en">{TAB_TITLES[tab.id].en}</span>
            </span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Data</span>
          {/* Demo mode must never claim a live server. */}
          <span style={{ color: isDemoMode() ? 'var(--accent-gold)' : 'var(--accent-emerald)' }}>
            {isDemoMode() ? '● DEMO 示例' : '● LIVE'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Server</span>
          <span>{isDemoMode() ? '未连接 (fixtures)' : 'localhost:3001'}</span>
        </div>
      </div>
    </div>
  );
};
