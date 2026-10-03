# Syndae Local Notification MCP Micro-Daemon

Self-hosted, 100% private local notification daemon for **Syndae AI Agent OS**, exposing standard JSON-RPC 2.0 MCP endpoints (`send_notification`) to alert the operator via local push servers (ntfy / Gotify) or native desktop notifications.

## Features
- **MCP 2024-11-05 Compliant**: Plugs into Syndae Agent OS or any MCP host via HTTP or STDIO.
- **100% Private & Local**: Zero reliance on Google FCM, Apple APNs, or third-party cloud brokers.
- **Multi-Channel Dispatch**: Dispatches to self-hosted ntfy/Gotify LAN instances and native desktop `notify-send`.
- **Urgency Tiers**: Supports `info`, `action_required`, and `alert` priorities.
- **Container Ready**: Includes lightweight Dockerfile and docker-compose deployment.

## Installation & Setup

```bash
git clone git@github.com:syndae-org/syndae-notify.git
cd syndae-notify
npm install
npm test
```

## Running the Daemon

```bash
# Direct node execution
PORT=8769 NTFY_URL=http://127.0.0.1:8080/syndae-alerts npm start

# Or using Docker
docker-compose up -d
```

## MCP Tools Exposed

| Tool | Parameters | Description |
|---|---|---|
| `send_notification` | `title`, `message`, `urgency`, `endpoint` | Dispatch an urgent or informative push notification |

## License
MIT
