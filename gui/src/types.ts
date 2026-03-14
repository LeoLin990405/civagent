export interface BotAccount {
  name: string
  displayName: string
  status: "online" | "offline"
  model: string
  sessions: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  groupPolicy?: string
  uptime?: string
  platform?: string
  platforms?: string[]
}

export interface Platform {
  key?: string
  name: string
  icon?: string
  status: 'connected' | 'disconnected'
  channels: number
  accounts: number
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  nextRun: string | null
  lastRun: string | null
  status: string
  agent?: string
}

export interface NodeInfo {
  id: string
  name: string
  status: 'online' | 'offline'
  lastHeartbeat: number
  os: string
  uptime: number
}

export interface SystemStatus {
  platform: string
  uptime: string
  uptimeSeconds: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  cpuLoad: number[]
  cpuCores?: number
  gateway: {
    status: string
    ping: number
    guilds: number
  }
  botAccounts: BotAccount[]
  totalSessions: number
  todayTokens: number
  logs: LogEntry[]
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  source?: string
}

export type TabName = "dashboard" | "court" | "departments" | "tokens" | "sessions" | "logs" | "system" | "settings" | "channels" | "memorial" | "nodes" | "notion" | "search" | "cron"
