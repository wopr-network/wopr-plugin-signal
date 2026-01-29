# wopr-plugin-signal

Signal integration for [WOPR](https://github.com/TSavo/wopr) using [signal-cli](https://github.com/AsamK/signal-cli).

## Features

- 🔒 **End-to-End Encryption** - Full Signal protocol encryption
- 👥 **Group Support** - Works in Signal groups
- 📡 **Real-time** - SSE-based message streaming
- 🔧 **Auto-start** - Can spawn signal-cli daemon automatically
- 🔒 **DM Policies** - Control who can message the bot
- 👀 **Identity Reactions** - Reacts with your agent's emoji
- 📎 **Attachments** - Configurable attachment handling

## Prerequisites

### 1. Install signal-cli

**macOS:**
```bash
brew install signal-cli
```

**Linux:**
See [signal-cli releases](https://github.com/AsamK/signal-cli/releases)

### 2. Register or Link Signal Account

**Register new number:**
```bash
signal-cli register
# Enter verification code
```

**Link existing device:**
```bash
signal-cli link
# Scan QR code with Signal app
```

**Verify registration:**
```bash
signal-cli send -m "Test" +1234567890
```

## Installation

```bash
wopr channels add signal
```

Or manually:
```bash
npm install wopr-plugin-signal
```

## Configuration

```yaml
# ~/.wopr/config.yaml
channels:
  signal:
    # Required
    account: "+1234567890"  # Your Signal phone number
    
    # Optional
    cliPath: "signal-cli"          # Path to signal-cli
    httpHost: "127.0.0.1"          # Daemon HTTP host
    httpPort: 8080                 # Daemon HTTP port
    autoStart: true                # Auto-start daemon
    
    # DM Policy: allowlist | pairing | open | disabled
    dmPolicy: "pairing"
    allowFrom:
      - "+15555550123"
      - "uuid:123e4567-e89b-12d3-a456-426614174000"
    
    # Group Policy
    groupPolicy: "allowlist"
    groupAllowFrom: []
    
    # Media handling
    mediaMaxMb: 8
    ignoreAttachments: false
    sendReadReceipts: false
```

## How It Works

1. **signal-cli daemon** runs an HTTP server (JSON-RPC + SSE)
2. **Plugin connects** to the daemon via HTTP
3. **Send messages** via JSON-RPC `send` method
4. **Receive messages** via SSE event stream
5. **Auto-reconnect** if connection drops

## Commands

| Command | Description |
|---------|-------------|
| `wopr configure --plugin signal` | Configure Signal settings |
| `signal-cli register` | Register new Signal account |
| `signal-cli link` | Link existing Signal device |
| `signal-cli listAccounts` | Show registered accounts |

## Architecture

```
┌─────────────┐      HTTP/SSE       ┌─────────────┐
│ WOPR Plugin │ ◄──────────────────►│ signal-cli  │
│             │   (localhost:8080)  │   daemon    │
└─────────────┘                     └─────────────┘
                                            │
                                            │ Signal Protocol
                                            ▼
                                     ┌─────────────┐
                                     │ Signal      │
                                     │ Servers     │
                                     └─────────────┘
```

## Troubleshooting

### signal-cli not found
```bash
which signal-cli
# If not found, install signal-cli or set cliPath in config
```

### Daemon not starting
```bash
# Check if signal-cli is registered
signal-cli listAccounts

# Start daemon manually to see errors
signal-cli daemon --http 127.0.0.1:8080
```

### Connection refused
- Check if daemon is running: `curl http://127.0.0.1:8080/api/v1/check`
- Verify httpHost/httpPort match
- Check firewall rules

### Messages not received
- Ensure `receiveMode` is not set to `manually`
- Check SSE connection in logs
- Verify account is registered: `signal-cli listAccounts`

## Security

- ✅ End-to-end encryption via Signal protocol
- ✅ Local-only HTTP daemon (127.0.0.1)
- ✅ No message content logged
- ✅ Keys stored by signal-cli locally

## License

MIT

## See Also

- [WOPR](https://github.com/TSavo/wopr) - The main WOPR project
- [signal-cli](https://github.com/AsamK/signal-cli) - Signal CLI tool
- [Signal Protocol](https://signal.org/docs/) - Cryptography details
