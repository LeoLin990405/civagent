export interface BotAccount {
  name: string
  displayName: string
  status: "online" | "offline"
  model: string
  sessions: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  groupPolicy: string
  uptime?: string
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
