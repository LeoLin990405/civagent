import { useState } from "react"

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || '菠萝王朝'

interface LoginProps {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('请输入访问令牌')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        localStorage.setItem('boluo_auth_token', token)
        onLogin(token)
      } else {
        setError('令牌验证失败，请检查后重试')
      }
    } catch {
      setError('网络错误，请稍后重试')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, #d4a574 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="w-full max-w-sm relative animate-fadeIn">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px rgba(212,165,116,0.3))' }}>🍍</div>
          <h1 className="text-[#e5e5e5] text-2xl font-light tracking-[0.2em]">
            {BRAND_NAME}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4a574]/50" />
            <p className="text-[#a3a3a3] text-xs tracking-widest uppercase">管理后台</p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4a574]/50" />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl p-8 border border-[#d4a574]/15 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-[#a3a3a3] text-xs uppercase tracking-wider mb-2.5">
                访问令牌
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="请输入访问令牌"
                className="w-full px-4 py-3 bg-[#0d0d1a]/70 border border-[#d4a574]/20 rounded-lg text-[#e5e5e5] placeholder-[#a3a3a3]/40 focus:outline-none focus:border-[#d4a574]/60 focus:shadow-[0_0_0_3px_rgba(212,165,116,0.1)] transition-all duration-200"
                autoFocus
              />
              {error && (
                <p className="text-[#ef4444] text-xs mt-2.5 flex items-center gap-1.5">
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#d4a574] to-[#c49464] text-[#0d0d1a] font-semibold rounded-lg hover:from-[#c49464] hover:to-[#b4844f] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#d4a574]/10 active:scale-[0.98]"
            >
              {loading ? '验证中...' : '进入后台'}
            </button>
          </form>

          <p className="text-[#a3a3a3]/60 text-[10px] text-center mt-6 tracking-wide">
            需要有效的访问令牌才能进入
          </p>
        </div>

        {/* Footer */}
        <p className="text-[#a3a3a3]/30 text-[10px] text-center mt-8 tracking-wider">
          {BRAND_NAME} © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
