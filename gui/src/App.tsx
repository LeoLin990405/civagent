import { useState, lazy, Suspense } from "react"
import type { TabName } from "./types"
import { useStatus } from "./hooks/useStatus"
import { useTheme } from "./theme"
import { PineappleLogo } from "./components/Logo"
import Login from "./pages/Login"

// 品牌名 — 修改此处即可全局替换
const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || '菠萝王朝'
const BRAND_SUBTITLE = import.meta.env.VITE_BRAND_SUBTITLE || 'Pineapple Dynasty'

// Lazy-loaded pages (code-splitting — reduces initial bundle, especially recharts-heavy pages)
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Departments = lazy(() => import("./pages/Departments"))
const TokenStats = lazy(() => import("./pages/TokenStats"))
const MessageLogs = lazy(() => import("./pages/MessageLogs"))
const SystemHealth = lazy(() => import("./pages/SystemHealth"))
const Sessions = lazy(() => import("./pages/Sessions"))
const Settings = lazy(() => import("./pages/Settings"))
const Court = lazy(() => import("./pages/Court"))
const Channels = lazy(() => import("./pages/Channels"))
const MemorialHall = lazy(() => import("./pages/MemorialHall"))
const Nodes = lazy(() => import("./pages/Nodes"))
const NotionBoard = lazy(() => import("./pages/NotionBoard"))
const Search = lazy(() => import("./pages/Search"))
const CronJobs = lazy(() => import("./pages/CronJobs"))
const Skills = lazy(() => import("./pages/Skills"))

const tabs: { key: TabName; label: string; icon: string }[] = [
  { key: "dashboard", label: "总览", icon: "📊" },
  { key: "court", label: "朝堂", icon: "🏯" },
  { key: "departments", label: "部门", icon: "🏛️" },
  { key: "tokens", label: "Token统计", icon: "🔥" },
  { key: "sessions", label: "会话", icon: "💬" },
  { key: "channels", label: "频道", icon: "📡" },
  { key: "nodes", label: "节点", icon: "🖥️" },
  { key: "notion", label: "奏章板", icon: "📜" },
  { key: "memorial", label: "奏报厅", icon: "🏮" },
  { key: "logs", label: "日志", icon: "📋" },
  { key: "search", label: "搜索", icon: "🔍" },
  { key: "cron", label: "定时", icon: "⏰" },
  { key: "skills", label: "技能", icon: "🧩" },
  { key: "system", label: "系统", icon: "⚙️" },
  { key: "settings", label: "设置", icon: "🔧" },
]

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('boluo_auth_token')
  })
  const [activeTab, setActiveTab] = useState<TabName>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionFilter, setSessionFilter] = useState<string | undefined>(undefined)
  const { theme, toggle: toggleTheme } = useTheme()
  const { data, loading, error, lastUpdated, refresh } = useStatus()

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  const renderPage = () => {
    if (loading && !data) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-[#d4a574] text-lg animate-pulse">加载中...</div>
        </div>
      )
    }
    if (error && !data) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-[#ef4444] text-lg mb-2">连接失败</div>
            <div className="text-[#a3a3a3] text-sm mb-4">{error}</div>
            <button onClick={refresh} className="px-4 py-2 bg-[#1a1a2e] text-[#d4a574] border border-[#d4a574] hover:bg-[#16213e] cursor-pointer">
              重试
            </button>
          </div>
        </div>
      )
    }
    if (!data) return null
    switch (activeTab) {
      case "dashboard": return <Dashboard data={data} onNavigate={(tab, filter) => {
        if (tab === 'sessions' && filter) {
          setSessionFilter(filter)
        }
        setActiveTab(tab as TabName)
      }} />
      case "court": return <Court />
      case "departments": return <Departments data={data} />
      case "tokens": return <TokenStats data={data} />
      case "sessions": return <Sessions initialFilter={sessionFilter} />
      case "channels": return <Channels />
      case "nodes": return <Nodes />
      case "notion": return <NotionBoard />
      case "memorial": return <MemorialHall />
      case "logs": return <MessageLogs data={data} />
      case "search": return <Search />
      case "cron": return <CronJobs />
      case "skills": return <Skills />
      case "system": return <SystemHealth data={data} />
      case "settings": return <Settings />
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-accent)' }}>
        
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-accent)' }}>
          <div className="flex items-center gap-2.5">
            <PineappleLogo size={32} />
            <div>
              <div className="text-base font-bold text-accent-gradient tracking-wide">{BRAND_NAME}</div>
              <div className="text-[9px] tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
                {data?.uptime ? `运行 ${data.uptime}` : BRAND_SUBTITLE}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); if (tab.key !== 'sessions') setSessionFilter(undefined) }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'nav-active'
                  : ''
              }`}
              style={{
                borderLeft: activeTab === tab.key ? '3px solid var(--accent)' : '3px solid transparent',
                backgroundColor: activeTab === tab.key ? 'var(--accent-glow)' : undefined,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-glow)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-accent)' }}>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="flex-1 py-2 text-xs rounded-lg cursor-pointer transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-accent)' }} title="刷新">↻ 刷新</button>
            <button onClick={toggleTheme} className="flex-1 py-2 text-xs rounded-lg cursor-pointer transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-accent)' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <button
            onClick={() => { localStorage.removeItem('boluo_auth_token'); setIsLoggedIn(false) }}
            className="w-full mt-2 py-2 text-xs rounded-lg cursor-pointer transition-colors hover:text-red-500"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-accent)' }}
          >
            退出登录
          </button>
          {lastUpdated && (
            <div className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
              更新: {lastUpdated.toLocaleTimeString("zh-CN")}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 h-12 flex items-center justify-between px-4" style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-accent)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-xl cursor-pointer" style={{ color: 'var(--accent)' }}>☰</button>
          <div className="flex items-center gap-2">
            <PineappleLogo size={22} />
            <span className="font-bold text-accent-gradient">{BRAND_NAME}</span>
          </div>
          <button onClick={refresh} className="cursor-pointer" style={{ color: 'var(--text-secondary)' }}>↻</button>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          {error && data && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>{error}</div>
          )}
          <div key={activeTab} className="animate-slideIn">
            <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-[#d4a574] text-lg animate-pulse">加载中...</div></div>}>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
