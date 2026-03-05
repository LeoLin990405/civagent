# Quadrants + Clawdbot Setup Guide

## 1. Vercel Environment Variables

Add these to the Quadrants Vercel project:

```
QUADRANTS_SERVICE_KEY=***REDACTED-generic-api-key***
QUADRANTS_SERVICE_USER_ID=<your-clerk-user-id>
```

For the chat widget (optional):
```
NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL=http://100.125.166.54:18789
NEXT_PUBLIC_CLAWDBOT_GATEWAY_TOKEN=***REDACTED-generic-api-key***
```

## 2. Clawdbot Environment

Export or add to agent env:
```
QUADRANTS_API_URL=https://quadrants.ch
QUADRANTS_API_KEY=***REDACTED-generic-api-key***
```

## 3. Quadrants Code Deployment

The following new files need to be committed and deployed:

### New API Routes:
- `app/api/service/route.ts` — Service API (all CRUD operations via API key)
- `app/api/webhooks/clawdbot/route.ts` — Webhook receiver

### New Component:
- `components/clawdbot-chat-widget.tsx` — Floating chat widget

### To embed the widget in Quadrants:
Add to `app/layout.tsx` or the projects page:
```tsx
import { ClawdbotChatWidget } from '@/components/clawdbot-chat-widget'

// In JSX:
<ClawdbotChatWidget projectId={currentProjectId} />
```

## 4. Heartbeat Integration

Add to `HEARTBEAT.md`:
```
Check Quadrants for overdue high-priority tasks (Q1) and remind user
```

## 5. Cron Job for Daily Briefing

```
Every morning at 8:00 AM: Fetch Quadrants priority tasks and send summary to Discord #quadrants channel
```

## Architecture

```
┌─────────────────┐     Service API      ┌──────────────────┐
│   Clawdbot      │ ──────────────────── │   Quadrants      │
│   (Skill/CLI)   │     /api/service     │   (Vercel)       │
│                 │ ◄────────────────── │                  │
│                 │     Webhook          │   /api/webhooks/ │
└────────┬────────┘     /clawdbot        └────────┬─────────┘
         │                                        │
    Discord/Signal                          Chat Widget
    (user commands)                    (embedded in Quadrants UI)
```
