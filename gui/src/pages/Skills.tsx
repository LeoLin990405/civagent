import { useState, useEffect } from "react"
import { useTheme } from "../theme"
import { getAuthToken } from "../utils/auth"

interface SkillInfo {
  name: string
  description: string
  version: string | null
  source: 'local' | 'clawdhub'
  location: 'workspace' | 'builtin'
  installed: boolean
  hasSkillMd: boolean
  files: number
  installedVersion?: string | null
  installedAt?: number | null
  slug?: string
  skillMdContent?: string
  fileList?: string[]
}

interface ExploreResult {
  slug: string
  version: string
  description: string
}

export default function Skills() {
  const { theme } = useTheme()
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [stats, setStats] = useState({ total: 0, workspace: 0, builtin: 0, clawdhub: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'workspace' | 'builtin' | 'clawdhub'>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillInfo | null>(null)
  
  // Explore / Hub search
  const [showExplore, setShowExplore] = useState(false)
  const [exploreResults, setExploreResults] = useState<ExploreResult[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)
  const [hubSearch, setHubSearch] = useState('')
  const [hubResults, setHubResults] = useState<ExploreResult[]>([])
  const [hubSearching, setHubSearching] = useState(false)

  const bg = theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#1a1a2e]'
  const sub = theme === 'light' ? 'text-gray-500' : 'text-[#a3a3a3]'
  const inputBg = theme === 'light' ? 'bg-gray-50 border-gray-300' : 'bg-[#0d0d1a] border-[#d4a574]/30 text-[#e5e5e5]'

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchSkills = async () => {
    try {
      const r = await fetch('/api/skills', { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      if (r.ok) {
        const d = await r.json()
        setSkills(d.skills || [])
        setStats({ total: d.total, workspace: d.workspace, builtin: d.builtin, clawdhub: d.clawdhub })
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSkills() }, [])

  const fetchDetail = async (name: string) => {
    try {
      const r = await fetch(`/api/skills/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (r.ok) {
        const d = await r.json()
        setSelectedSkill(d)
      }
    } catch {}
  }

  const handleInstall = async (slug: string) => {
    setActionLoading(slug)
    try {
      const r = await fetch('/api/skills/install', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const d = await r.json()
      if (r.ok && d.success) {
        showToast(`✅ ${slug} 安装成功`)
        fetchSkills()
      } else {
        showToast(`❌ 安装失败: ${d.error || d.output || '未知错误'}`, 'error')
      }
    } catch (e: any) {
      showToast(`❌ 安装失败: ${e.message}`, 'error')
    }
    setActionLoading(null)
  }

  const handleUpdate = async (slug?: string) => {
    const key = slug || '__all__'
    setActionLoading(key)
    try {
      const r = await fetch('/api/skills/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const d = await r.json()
      if (r.ok && d.success) {
        showToast(`✅ ${slug || '全部'} 更新成功`)
        fetchSkills()
      } else {
        showToast(`❌ 更新失败: ${d.error || '未知错误'}`, 'error')
      }
    } catch (e: any) {
      showToast(`❌ 更新失败: ${e.message}`, 'error')
    }
    setActionLoading(null)
  }

  const handleExplore = async () => {
    setShowExplore(true)
    setExploreLoading(true)
    try {
      const r = await fetch('/api/skills/explore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await r.json()
      setExploreResults(d.results || [])
    } catch {}
    setExploreLoading(false)
  }

  const handleHubSearch = async () => {
    if (!hubSearch.trim()) return
    setHubSearching(true)
    try {
      const r = await fetch('/api/skills/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: hubSearch }),
      })
      const d = await r.json()
      setHubResults(d.results || [])
    } catch {}
    setHubSearching(false)
  }

  // Filter skills
  const filtered = skills.filter(s => {
    if (filter === 'workspace' && s.location !== 'workspace') return false
    if (filter === 'builtin' && s.location !== 'builtin') return false
    if (filter === 'clawdhub' && s.source !== 'clawdhub') return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return (
    <div className={`${sub} p-4 text-center`}>
      <div className="animate-pulse">加载 Skills 中...</div>
    </div>
  )

  // Detail view
  if (selectedSkill) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button onClick={() => setSelectedSkill(null)}
          className={`text-sm ${sub} hover:text-[#d4a574] cursor-pointer flex items-center gap-1`}>
          ← 返回列表
        </button>

        {/* Header */}
        <div className={`${bg} rounded-lg p-4 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#d4a574] flex items-center gap-2">
                🧩 {selectedSkill.name}
                {selectedSkill.source === 'clawdhub' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-normal">ClawdHub</span>
                )}
                {selectedSkill.location === 'builtin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-normal">内置</span>
                )}
              </h2>
              <p className={`text-sm mt-1 ${sub}`}>{selectedSkill.description || '无描述'}</p>
            </div>
            {selectedSkill.source === 'clawdhub' && (
              <button onClick={() => handleUpdate(selectedSkill.slug || selectedSkill.name)}
                disabled={actionLoading === (selectedSkill.slug || selectedSkill.name)}
                className="px-3 py-1.5 text-xs border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer disabled:opacity-50">
                {actionLoading === (selectedSkill.slug || selectedSkill.name) ? '更新中...' : '🔄 更新'}
              </button>
            )}
          </div>

          {/* Meta info */}
          <div className={`flex flex-wrap gap-4 mt-4 text-xs ${sub}`}>
            {selectedSkill.version && <span>📦 版本: <span className="text-[#d4a574]">{selectedSkill.version}</span></span>}
            {selectedSkill.installedAt && (
              <span>📅 安装: {new Date(selectedSkill.installedAt).toLocaleDateString('zh-CN')}</span>
            )}
            <span>📁 文件: {selectedSkill.files}</span>
            <span>📍 位置: {selectedSkill.location === 'workspace' ? '工作区' : '内置'}</span>
          </div>
        </div>

        {/* Files list */}
        {selectedSkill.fileList && selectedSkill.fileList.length > 0 && (
          <div className={`${bg} rounded-lg p-4`}>
            <h3 className={`text-xs uppercase tracking-wider mb-3 ${sub}`}>📂 文件列表</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {selectedSkill.fileList.map(f => (
                <div key={f} className={`text-xs font-mono py-1 px-2 rounded ${
                  theme === 'light' ? 'bg-gray-50' : 'bg-[#0d0d1a]'
                } ${f === 'SKILL.md' ? 'text-[#d4a574]' : sub}`}>
                  {f === 'SKILL.md' ? '📜 ' : '📄 '}{f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILL.md content */}
        {selectedSkill.skillMdContent && (
          <div className={`${bg} rounded-lg p-4`}>
            <h3 className={`text-xs uppercase tracking-wider mb-3 ${sub}`}>📜 SKILL.md</h3>
            <pre className={`text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto p-3 rounded ${
              theme === 'light' ? 'bg-gray-50' : 'bg-[#0d0d1a]'
            } ${sub}`}>
              {selectedSkill.skillMdContent}
            </pre>
          </div>
        )}
      </div>
    )
  }

  // Explore / Hub modal
  if (showExplore) {
    const installedSlugs = new Set(skills.filter(s => s.source === 'clawdhub').map(s => s.slug || s.name))

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setShowExplore(false); setHubResults([]) }}
            className={`text-sm ${sub} hover:text-[#d4a574] cursor-pointer flex items-center gap-1`}>
            ← 返回列表
          </button>
          <h2 className="text-lg font-medium text-[#d4a574]">🌐 ClawdHub 技能商店</h2>
        </div>

        {/* Search bar */}
        <div className={`${bg} rounded-lg p-4`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={hubSearch}
              onChange={e => setHubSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleHubSearch()}
              placeholder="搜索技能..."
              className={`flex-1 px-3 py-2 rounded border text-sm ${inputBg}`}
            />
            <button onClick={handleHubSearch}
              disabled={hubSearching}
              className="px-4 py-2 bg-[#d4a574] text-[#0d0d1a] text-sm font-medium rounded hover:bg-[#c49464] cursor-pointer disabled:opacity-50">
              {hubSearching ? '搜索中...' : '🔍 搜索'}
            </button>
          </div>
        </div>

        {/* Search results */}
        {hubResults.length > 0 && (
          <div className="space-y-2">
            <h3 className={`text-xs uppercase tracking-wider ${sub}`}>搜索结果</h3>
            {hubResults.map(r => (
              <div key={r.slug} className={`${bg} rounded-lg p-3 flex items-center justify-between gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🧩 {r.slug}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-[#0d0d1a] text-[#a3a3a3]'
                    } font-mono`}>v{r.version}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${sub} truncate`}>{r.description}</div>
                </div>
                {installedSlugs.has(r.slug) ? (
                  <span className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 flex-shrink-0">已安装</span>
                ) : (
                  <button onClick={() => handleInstall(r.slug)}
                    disabled={actionLoading === r.slug}
                    className="px-3 py-1.5 text-xs bg-[#d4a574] text-[#0d0d1a] rounded hover:bg-[#c49464] cursor-pointer disabled:opacity-50 flex-shrink-0">
                    {actionLoading === r.slug ? '安装中...' : '📥 安装'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Explore results */}
        <div className="space-y-2">
          <h3 className={`text-xs uppercase tracking-wider ${sub}`}>
            {exploreLoading ? '加载最新技能中...' : '最新技能'}
          </h3>
          {exploreLoading ? (
            <div className="text-center py-8 animate-pulse text-[#d4a574]">加载中...</div>
          ) : exploreResults.length === 0 ? (
            <div className={`text-center py-8 ${sub}`}>暂无数据，尝试搜索</div>
          ) : (
            exploreResults.map(r => (
              <div key={r.slug} className={`${bg} rounded-lg p-3 flex items-center justify-between gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🧩 {r.slug}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-[#0d0d1a] text-[#a3a3a3]'
                    } font-mono`}>v{r.version}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${sub} truncate`}>{r.description}</div>
                </div>
                {installedSlugs.has(r.slug) ? (
                  <span className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-400 flex-shrink-0">已安装</span>
                ) : (
                  <button onClick={() => handleInstall(r.slug)}
                    disabled={actionLoading === r.slug}
                    className="px-3 py-1.5 text-xs bg-[#d4a574] text-[#0d0d1a] rounded hover:bg-[#c49464] cursor-pointer disabled:opacity-50 flex-shrink-0">
                    {actionLoading === r.slug ? '安装中...' : '📥 安装'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Main list view
  return (
    <div className="space-y-4 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm animate-[fadeIn_0.3s] ${
          toast.type === 'success'
            ? (theme === 'light' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-green-500/20 border border-green-500/50 text-green-400')
            : (theme === 'light' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/20 border border-red-500/50 text-red-400')
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${bg} rounded-lg p-3 cursor-pointer transition-all ${filter === 'all' ? 'ring-1 ring-[#d4a574]' : ''}`}
          onClick={() => setFilter('all')}>
          <div className={`text-[10px] uppercase ${sub}`}>总技能</div>
          <div className="font-mono text-lg sm:text-2xl text-[#d4a574]">{stats.total}</div>
        </div>
        <div className={`${bg} rounded-lg p-3 cursor-pointer transition-all ${filter === 'workspace' ? 'ring-1 ring-green-400' : ''}`}
          onClick={() => setFilter(filter === 'workspace' ? 'all' : 'workspace')}>
          <div className={`text-[10px] uppercase ${sub}`}>工作区</div>
          <div className="font-mono text-lg sm:text-2xl text-green-400">{stats.workspace}</div>
        </div>
        <div className={`${bg} rounded-lg p-3 cursor-pointer transition-all ${filter === 'builtin' ? 'ring-1 ring-blue-400' : ''}`}
          onClick={() => setFilter(filter === 'builtin' ? 'all' : 'builtin')}>
          <div className={`text-[10px] uppercase ${sub}`}>内置</div>
          <div className="font-mono text-lg sm:text-2xl text-blue-400">{stats.builtin}</div>
        </div>
        <div className={`${bg} rounded-lg p-3 cursor-pointer transition-all ${filter === 'clawdhub' ? 'ring-1 ring-purple-400' : ''}`}
          onClick={() => setFilter(filter === 'clawdhub' ? 'all' : 'clawdhub')}>
          <div className={`text-[10px] uppercase ${sub}`}>ClawdHub</div>
          <div className="font-mono text-lg sm:text-2xl text-purple-400">{stats.clawdhub}</div>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 搜索技能..."
          className={`flex-1 px-3 py-2 rounded border text-sm ${inputBg}`}
        />
        <div className="flex gap-2">
          <button onClick={handleExplore}
            className="px-3 py-2 text-xs bg-[#d4a574] text-[#0d0d1a] rounded hover:bg-[#c49464] cursor-pointer font-medium">
            🌐 技能商店
          </button>
          <button onClick={() => handleUpdate()}
            disabled={actionLoading === '__all__'}
            className="px-3 py-2 text-xs border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer disabled:opacity-50">
            {actionLoading === '__all__' ? '更新中...' : '🔄 全部更新'}
          </button>
          <button onClick={fetchSkills}
            className="px-3 py-2 text-xs border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer">
            ↻
          </button>
        </div>
      </div>

      {/* Skills list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className={`text-center py-8 ${sub}`}>
            {search ? '没有匹配的技能' : '暂无技能'}
          </div>
        )}
        {filtered.map(skill => (
          <div key={`${skill.location}-${skill.name}`}
            className={`${bg} rounded-lg p-3 sm:p-4 transition-all hover:ring-1 hover:ring-[#d4a574]/30 cursor-pointer`}
            onClick={() => fetchDetail(skill.name)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">🧩 {skill.name}</span>
                  {/* Tags */}
                  {skill.location === 'workspace' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">工作区</span>
                  )}
                  {skill.location === 'builtin' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">内置</span>
                  )}
                  {skill.source === 'clawdhub' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">ClawdHub</span>
                  )}
                  {skill.version && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-[#0d0d1a] text-[#a3a3a3]'
                    }`}>v{skill.version}</span>
                  )}
                  {!skill.hasSkillMd && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">无SKILL.md</span>
                  )}
                </div>
                <div className={`text-xs mt-1 ${sub} line-clamp-1`}>
                  {skill.description || '无描述'}
                </div>
                <div className={`text-[10px] mt-1 flex gap-3 ${sub}`}>
                  <span>📁 {skill.files} 文件</span>
                  {skill.installedAt && (
                    <span>📅 {new Date(skill.installedAt).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {skill.source === 'clawdhub' && (
                  <button onClick={() => handleUpdate(skill.slug || skill.name)}
                    disabled={actionLoading === (skill.slug || skill.name)}
                    className="px-2 py-1 text-[10px] border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer disabled:opacity-50">
                    {actionLoading === (skill.slug || skill.name) ? '...' : '🔄'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
