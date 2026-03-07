# Quadrants + OpenClaw Setup Guide

## 1. Vercel Environment Variables

Add these to the Quadrants Vercel project:

```
QUADRANTS_SERVICE_KEY=YOUR_SERVICE_API_KEY
QUADRANTS_SERVICE_USER_ID=<your-clerk-user-id>
```

For the chat widget (optional):
```
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://100.125.166.54:18789
NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN=YOUR_GATEWAY_TOKEN
```

## 2. OpenClaw Environment

Export or add to agent env:
```
QUADRANTS_API_URL=https://quadrants.ch
QUADRANTS_API_KEY=YOUR_SERVICE_API_KEY
```

## 3. Quadrants Code Deployment

The following new files need to be committed and deployed:

### New API Routes:
- `app/api/service/route.ts` — Service API (all CRUD operations via API key)
- `app/api/webhooks/openclaw/route.ts` — Webhook receiver

### New Component:
- `components/openclaw-chat-widget.tsx` — Floating chat widget

### To embed the widget in Quadrants:
Add to `app/layout.tsx` or the projects page:
```tsx
import { OpenClawChatWidget } from '@/components/openclaw-chat-widget'

// In JSX:
<OpenClawChatWidget projectId={currentProjectId} />
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
│   OpenClaw      │ ──────────────────── │   Quadrants      │
│   (Skill/CLI)   │     /api/service     │   (Vercel)       │
│                 │ ◄────────────────── │                  │
│                 │     Webhook          │   /api/webhooks/ │
└────────┬────────┘     /openclaw        └────────┬─────────┘
         │                                        │
    Discord/Signal                          Chat Widget
    (user commands)                    (embedded in Quadrants UI)
```
