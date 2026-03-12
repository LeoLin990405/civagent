import { StrictMode, Component } from "react"
import type { ReactNode, ErrorInfo } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

// Error boundary to prevent black screen on React crash
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AI朝廷] React crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0d0d1a', color: '#e5e5e5', fontFamily: 'system-ui', padding: '20px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍍</div>
            <h1 style={{ color: '#d4a574', fontSize: '20px', marginBottom: '8px' }}>AI 朝廷 · 系统异常</h1>
            <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '16px' }}>
              页面渲染出错，请刷新重试
            </p>
            <pre style={{
              background: '#1a1a2e', padding: '12px', borderRadius: '8px', fontSize: '11px',
              color: '#ef4444', textAlign: 'left', overflow: 'auto', maxHeight: '200px',
              border: '1px solid rgba(212,165,116,0.2)',
            }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              style={{
                marginTop: '16px', padding: '10px 24px', background: '#d4a574', color: '#0d0d1a',
                border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
