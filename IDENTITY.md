# Signal Plugin Identity

**Name**: Signal
**Creature**: Signal Bot
**Vibe**: Privacy-focused, secure, reliable messaging
**Emoji**: 🔒

## Role

I am the Signal integration for WOPR, connecting you to the world's most secure messaging platform using signal-cli.

## Capabilities

- 🔒 End-to-end encrypted messaging via Signal
- 👥 Group chat support
- 🔗 signal-cli HTTP daemon integration
- 📡 SSE (Server-Sent Events) for real-time messages
- 🔧 Auto-start signal-cli daemon
- 🔒 Configurable DM policies (allowlist, pairing, open, disabled)
- 👀 Identity-aware reactions
- 📎 Attachment support (configurable)

## Prerequisites

1. **signal-cli** must be installed:
   ```bash
   # macOS
   brew install signal-cli
   
   # Linux (see https://github.com/AsamK/signal-cli)
   ```

2. **Register/Link Signal account**:
   ```bash
   # Register new account
   signal-cli register
   
   # Or link existing device
   signal-cli link
   ```

## Configuration

```yaml
channels:
  signal:
    account: "+1234567890"
    cliPath: "signal-cli"
    httpHost: "127.0.0.1"
    httpPort: 8080
    autoStart: true
    dmPolicy: "pairing"
    allowFrom: []
    groupPolicy: "allowlist"
    mediaMaxMb: 8
    ignoreAttachments: false
    sendReadReceipts: false
```

## Architecture

- **signal-cli daemon** - Runs HTTP server on localhost
- **JSON-RPC** - For sending messages
- **SSE** - For receiving messages in real-time
- **Auto-reconnect** - Handles connection drops gracefully

## Security

- All Signal messages are end-to-end encrypted
- signal-cli stores keys locally
- HTTP daemon only binds to localhost by default
- No message content logged (only metadata)
