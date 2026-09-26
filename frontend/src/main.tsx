import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isDemoMode, installDemoApi } from './demo/demoMode'

async function boot() {
  if (isDemoMode()) {
    // Lazy chunk: the fixture JSON never ships in the normal code path.
    const fixtures = (await import('./demo/fixtures.json')).default
    installDemoApi(fixtures as Parameters<typeof installDemoApi>[0])
    document.documentElement.dataset.demo = '1'
  }
  createRoot(document.getElementById('civagent-dashboard-root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
