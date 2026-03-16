import { useState, useEffect, useCallback } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { SystemStatus } from "../types"
import { useTheme } from "../theme"
import { getAuthToken } from "../utils/auth"

interface Props {
  data: SystemStatus
  onNavigate?: (tab: string, filter?: string) => void
}


interface CityWeather {
  name: string; tz: string; temp: string; feelsLike?: string
  desc: string; humidity?: string; windSpeed?: string; icon: string
}

interface IpLocation {
  ip: string; city: string; region: string; country: string
  lastSeen: number
}

interface DashboardSummary {
  totalInput: number
  totalOutput: number
  totalTokens: number
  totalSessions: number
  activeSessions: number
  deptRanking: { name: string; updatedAt: number; messages: number; tokens: number; lastMessagePreview?: string }[]
  dailyTrend: { date: string; tokens: number }[]
  systemLoad?: { cpu1m: number; cpu5m: number; cpu15m: number; memUsedPct: number; diskUsage?: string }
  lastUpdated?: number
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

function relTime(ts: number) {
  if (!ts) return '未知'
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24)
  if (d > 0) return `${d}天前`
  if (h > 0) return `${h}小时前`
  if (m > 0) return `${m}分钟前`
  return '刚刚'
}

/** Color grade: green < 50%, yellow < 80%, red >= 80% */
function loadColor(pct: number): string {
  if (pct >= 80) return 'text-red-400'
  if (pct >= 50) return 'text-yellow-400'
  return 'text-green-400'
}
/** Solid bar color for progress indicators */
function loadBarColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

function Clock({ tz, label, emoji }: { tz: string; label: string; emoji: string }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
      setDate(now.toLocaleDateString('zh-CN', { timeZone: tz, month: 'short', day: 'numeric', weekday: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tz])
  return (
    <div className="text-center py-2">
      <div className="font-mono text-xl sm:text-2xl text-[#d4a574] tabular-nums">{time}</div>
      <div className="text-[10px] sm:text-xs text-[#a3a3a3] mt-0.5">{emoji} {label}</div>
      <div className="text-[10px] text-[#a3a3a3]/60">{date}</div>
    </div>
  )
}

// Custom tooltip for trend chart
function TrendTooltip({ active, payload, label, dailyTrend }: any) {
  const { theme } = useTheme()
  if (!active || !payload?.length) return null

  const value = payload[0].value as number
  // Find index of current point to compute day-over-day change
  const idx = dailyTrend?.findIndex((d: any) => d.date.slice(5) === label)
  let change = ''
  if (idx > 0 && dailyTrend) {
    const prev = dailyTrend[idx - 1].tokens
    if (prev > 0) {
      const pct = ((value - prev) / prev * 100)
      change = `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% vs 前日`
    }
  }

  return (
    <div className={`px-3 py-2 rounded-lg border text-xs ${
      theme === 'light' ? 'bg-white border-gray-300' : 'bg-[#1a1a2e] border-[#d4a574]'
    }`}>
      <div className="text-[#d4a574] font-medium">{label}</div>
      <div className="font-mono mt-1">{fmt(value)} tokens</div>
      {change && <div className="text-[10px] text-[#a3a3a3] mt-0.5">{change}</div>}
    </div>
  )
}

function TokenTrend({ dailyTrend }: { dailyTrend: { date: string; tokens: number }[] }) {
  const { theme } = useTheme()
  const sub = theme === 'light' ? 'text-gray-500' : 'text-[#a3a3a3]'

  if (!dailyTrend || dailyTrend.length === 0) return null

  const chartData = dailyTrend.map(d => ({
    date: d.date.slice(5),
    tokens: d.tokens,
  }))

  const todayTokens = dailyTrend.length >= 1 ? dailyTrend[dailyTrend.length - 1].tokens : 0
  const yesterdayTokens = dailyTrend.length >= 2 ? dailyTrend[dailyTrend.length - 2].tokens : 0
  const diff = yesterdayTokens > 0 ? ((todayTokens - yesterdayTokens) / yesterdayTokens * 100) : 0
  const isUp = diff >= 0

  return (
    <div className={`${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#1a1a2e]'} rounded-lg p-3 sm:p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-[10px] sm:text-xs uppercase tracking-wider ${sub}`}>📈 7日Token趋势</h3>
        <div className="flex items-center gap-1">
          <span className={`text-xs font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
          </span>
          <span className={`text-[10px] ${sub}`}>vs 昨日</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#333'} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a3a3a3' }} />
          <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} tickFormatter={fmt} width={45} />
          <Tooltip content={<TrendTooltip dailyTrend={dailyTrend} />} />
          <Line
            type="monotone"
            dataKey="tokens"
            stroke="#d4a574"
            strokeWidth={2}
            dot={{ fill: '#d4a574', r: 3 }}
            activeDot={{ r: 5, fill: '#e5b584' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Dashboard({ data, onNavigate }: Props) {
  const { theme } = useTheme()
  const [weather, setWeather] = useState<CityWeather[]>([])
  const [locations, setLocations] = useState<Record<string, IpLocation>>({})
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const bg = theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#1a1a2e]'
  const sub = theme === 'light' ? 'text-gray-500' : 'text-[#a3a3a3]'

  useEffect(() => {
    const h = { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    fetch('/api/weather/cities', h).then(r => r.json()).then(d => setWeather(d.cities || [])).catch(() => {})
    // Only fetch /api/location/all (which includes all roles); skip /api/location/track to avoid redundant request and state overwrite
    fetch('/api/location/all', h).then(r => r.json()).then(d => setLocations(d.locations || {})).catch(() => {})
    fetch('/api/dashboard/summary', h).then(r => r.json()).then(d => setSummary(d)).catch(() => {})
  }, [])

  const onlineCount = data.botAccounts.filter(b => b.status === "online").length
  const totalCount = data.botAccounts.length
  const TOKEN_ALERT = 2000000

  const sortedByTokens = [...data.botAccounts].sort((a, b) => b.totalTokens - a.totalTokens)
  const maxTokens = sortedByTokens[0]?.totalTokens || 1

  const realTotalTokens = summary?.totalTokens ?? data.todayTokens
  const realTotalSessions = summary?.totalSessions ?? data.totalSessions
  const realActiveSessions = summary?.activeSessions ?? 0

  const deptRanking = summary?.deptRanking || []
  const topActive = deptRanking.slice(0, 5)

  // System load — normalize by CPU core count to get meaningful percentage
  const cpuCores = data.cpuCores || 1
  const cpuPct = Math.min((Number(summary?.systemLoad?.cpu1m ?? data.cpuLoad?.[0] ?? 0) / cpuCores) * 100, 100)
  const memPct = Number(summary?.systemLoad?.memUsedPct ?? 0)

  const handleDeptClick = useCallback((deptName: string) => {
    if (onNavigate) {
      onNavigate('sessions', deptName)
    }
  }, [onNavigate])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 时钟 + 天气 */}
      <div className={`${bg} rounded-lg p-3 sm:p-4`}>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Clock tz="Europe/Zurich" label="苏黎世" emoji="🇨🇭" />
          <Clock tz="Asia/Shanghai" label="南京" emoji="🇨🇳" />
          <Clock tz="Asia/Shanghai" label="杭州" emoji="🇨🇳" />
        </div>
        {weather.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 pt-3 border-t border-[#d4a574]/10">
            {weather.map(c => (
              <div key={c.name} className="text-center">
                <span className="text-lg sm:text-xl">{c.icon}</span>
                <span className="ml-1 text-base sm:text-lg font-mono text-[#d4a574]">{c.temp}°</span>
                <div className={`text-[10px] sm:text-xs ${sub}`}>{c.desc} · 湿{c.humidity}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 帝后位置 */}
      {Object.keys(locations).length > 0 && (
        <div className={`${bg} rounded-lg p-3 sm:p-4`}>
          <div className="flex flex-wrap gap-4 justify-around">
            {Object.entries(locations).map(([role, loc]) => (
              <div key={role} className="flex items-center gap-2">
                <span className="text-lg">{role === 'emperor' ? '👑' : '👸'}</span>
                <div>
                  <div className="text-xs sm:text-sm font-medium">{role === 'emperor' ? '皇帝' : '皇后'}</div>
                  <div className={`text-[10px] sm:text-xs ${sub}`}>
                    📍 {loc.city || '未知'}{loc.region ? ` · ${loc.region}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token 告警 */}
      {data.todayTokens > TOKEN_ALERT && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2">
          <span>⚠️</span>
          <span className="text-yellow-500 text-xs sm:text-sm">今日Token已超2M: {fmt(data.todayTokens)}</span>
        </div>
      )}

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { label: '在线部门', value: `${onlineCount}/${totalCount}`, icon: '🏛️' },
          { label: '总Token', value: fmt(realTotalTokens), icon: '🔥' },
          { label: '总会话', value: realTotalSessions.toString(), icon: '💬' },
          { label: '活跃会话', value: realActiveSessions.toString(), icon: '⚡' },
        ].map(c => (
          <div key={c.label} className={`${bg} rounded-lg p-3 sm:p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs uppercase ${sub}`}>{c.label}</span>
              <span>{c.icon}</span>
            </div>
            <div className="font-mono text-lg sm:text-2xl text-[#d4a574] mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      {/* 系统负载 - 颜色分级 */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${bg} rounded-lg p-3 text-center`}>
          <div className={`text-[10px] ${sub}`}>⏱ 运行时长</div>
          <div className="font-mono text-sm text-[#d4a574] mt-1">{data.uptime}</div>
        </div>
        <div className={`${bg} rounded-lg p-3 text-center`}>
          <div className={`text-[10px] ${sub}`}>📊 CPU</div>
          <div className={`font-mono text-sm mt-1 ${loadColor(cpuPct)}`}>{cpuPct.toFixed(1)}%</div>
          <div className={`h-1 rounded-full mt-1.5 ${theme === 'light' ? 'bg-gray-200' : 'bg-[#0d0d1a]'}`}>
            <div className={`h-full rounded-full ${loadBarColor(cpuPct)}`} style={{ width: `${Math.min(cpuPct, 100)}%` }} />
          </div>
        </div>
        <div className={`${bg} rounded-lg p-3 text-center`}>
          <div className={`text-[10px] ${sub}`}>💾 内存</div>
          <div className={`font-mono text-sm mt-1 ${loadColor(memPct)}`}>{memPct.toFixed(0)}%</div>
          <div className={`h-1 rounded-full mt-1.5 ${theme === 'light' ? 'bg-gray-200' : 'bg-[#0d0d1a]'}`}>
            <div className={`h-full rounded-full ${loadBarColor(memPct)}`} style={{ width: `${Math.min(memPct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 7日Token趋势图 - 真实数据 + 增强tooltip */}
      {summary?.dailyTrend && <TokenTrend dailyTrend={summary.dailyTrend} />}

      {/* 最近活动 */}
      {topActive.length > 0 && (
        <div className={`${bg} rounded-lg p-3 sm:p-4`}>
          <h3 className={`text-[10px] sm:text-xs uppercase tracking-wider mb-3 ${sub}`}>🕐 最近活动</h3>
          <div className="space-y-2">
            {topActive.map((dept, i) => (
              <div key={dept.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <span className="text-xs sm:text-sm">{dept.name}</span>
                  <span className={`text-[10px] ${sub}`}>💬{dept.messages} · 🔥{fmt(dept.tokens)}</span>
                </div>
                <span className={`text-[10px] sm:text-xs ${sub}`}>{relTime(dept.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token消耗排行 - 可点击跳转Sessions */}
      <div className={`${bg} rounded-lg p-3 sm:p-4`}>
        <h3 className={`text-[10px] sm:text-xs uppercase tracking-wider mb-3 ${sub}`}>🔥 Token消耗排行</h3>
        <div className="space-y-1.5 sm:space-y-2">
          {sortedByTokens.filter(d => d.totalTokens > 0).map((bot, i) => {
            const pct = (bot.totalTokens / maxTokens) * 100
            return (
              <div
                key={bot.name}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-[#d4a574]/5 rounded p-0.5 transition-colors"
                onClick={() => handleDeptClick(bot.displayName || bot.name)}
                title={`点击查看${bot.displayName || bot.name}的会话`}
              >
                <span className={`w-4 text-[10px] sm:text-xs font-mono ${i < 3 ? 'text-[#d4a574] font-bold' : sub}`}>{i + 1}</span>
                <span className="w-12 sm:w-16 text-[10px] sm:text-xs truncate">{bot.displayName || bot.name}</span>
                <div className={`flex-1 h-4 sm:h-5 rounded overflow-hidden ${theme === 'light' ? 'bg-gray-100' : 'bg-[#0d0d1a]'}`}>
                  <div
                    className={`h-full rounded ${i === 0 ? 'bg-gradient-to-r from-[#d4a574] to-[#e5b584]' : i < 3 ? 'bg-[#d4a574]/70' : 'bg-[#d4a574]/40'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 sm:w-16 text-[10px] sm:text-xs font-mono text-right text-[#d4a574]">{fmt(bot.totalTokens)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 部门状态 */}
      <div>
        <h3 className={`text-[10px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-3 ${sub}`}>🏛️ 部门状态</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {data.botAccounts.map(bot => {
            const deptInfo = deptRanking.find(d => d.name === (bot.displayName || bot.name))
            const lastActiveStr = deptInfo ? relTime(deptInfo.updatedAt) : '未知'
            return (
              <div
                key={bot.name}
                className={`${bg} rounded-lg p-2.5 sm:p-3 border-l-2 cursor-pointer hover:ring-1 hover:ring-[#d4a574]/30 transition-all ${bot.status === 'online' ? 'border-green-500' : 'border-red-500'}`}
                onClick={() => handleDeptClick(bot.displayName || bot.name)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs sm:text-sm font-medium truncate">{bot.displayName || bot.name}</span>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${bot.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className={`text-[10px] ${sub} truncate`}>{bot.model?.replace(/^[^/]+\//, '') || '-'}</div>
                <div className="flex justify-between mt-0.5 text-[10px] sm:text-xs">
                  <span className={sub}>会话{bot.sessions}</span>
                  <span className="text-[#d4a574] font-mono">{fmt(bot.totalTokens)}</span>
                </div>
                <div className={`text-[9px] ${sub} mt-0.5`}>⏱ {lastActiveStr}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
