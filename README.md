# 🔒 wopr-plugin-signal

[![npm version](https://img.shields.io/npm/v/wopr-plugin-signal.svg)](https://www.npmjs.com/package/wopr-plugin-signal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WOPR](https://img.shields.io/badge/WOPR-Plugin-blue)](https://github.com/TSavo/wopr)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![signal-cli](https://img.shields.io/badge/signal--cli-Required-green.svg)](https://github.com/AsamK/signal-cli)

> Signal integration for [WOPR](https://github.com/TSavo/wopr) using [signal-cli](https://github.com/AsamK/signal-cli)

Part of the [WOPR](https://github.com/TSavo/wopr) ecosystem - Self-sovereign AI session management over P2P.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)
- [Security](#-security)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔒 **End-to-End Encryption** | Full Signal protocol encryption for all messages |
| 👥 **Group Support** | Participate in Signal group chats seamlessly |
| 📡 **Real-time Streaming** | SSE-based message streaming for instant delivery |
| 🔧 **Auto-start Daemon** | Automatically spawns signal-cli daemon when needed |
| 🔐 **DM Policies** | Control who can message your bot (allowlist, pairing, open, disabled) |
| 👀 **Identity Reactions** | Reacts with your agent's emoji for acknowledgment |
| 📎 **Attachments** | Configurable attachment handling with size limits |
| 🔄 **Auto-reconnect** | Gracefully handles connection drops |
| 🐳 **Docker Support** | Run signal-cli in Docker containers |

---

## 📦 Prerequisites

### 1. Install signal-cli

**macOS:**
```bash
brew install signal-cli
```

**Ubuntu/Debian:**
```bash
# Download latest release from https://github.com/AsamK/signal-cli/releases
# Example for v0.13.12:
wget https://github.com/AsamK/signal-cli/releases/download/v0.13.12/signal-cli-0.13.12-linux-x86_64.tar.gz
tar -xzf signal-cli-0.13.12-linux-x86_64.tar.gz
sudo mv signal-cli-0.13.12 /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/
```

**Arch Linux:**
```bash
yay -S signal-cli
```

**Other Linux:**
See [INSTALL.md](docs/INSTALL.md) for detailed instructions.

### 2. Register or Link Your Signal Account

You have two options for setting up your Signal account with signal-cli:

#### 📱 Option A: Link Existing Device (Recommended)

Link an existing Signal installation on your phone:

```bash
# Generate QR code and link
signal-cli link

# Or specify a device name
signal-cli link --name "WOPR Bot"
```

Scan the QR code with your Signal app:
1. Open Signal on your phone
2. Go to Settings → Linked Devices
3. Tap "+" to add a new device
4. Scan the QR code displayed in your terminal

#### 🆕 Option B: Register New Number

Register a new phone number (requires SMS verification):

```bash
# Register with phone number (E.164 format)
signal-cli register --voice  # Use --voice for voice call instead of SMS

# Enter the verification code when prompted
signal-cli verify 123456  # Replace with actual code
```

**When to use which:**
- **Link** - Use when you already have Signal on your phone and want the bot to share your identity
- **Register** - Use for dedicated bot numbers or when you don't want to use your personal Signal

### 3. Verify Registration

```bash
# Check account status
signal-cli listAccounts

# Send a test message
signal-cli send -m "Hello from WOPR!" +1234567890
```

---

## 🚀 Installation

### Via WOPR CLI (Recommended)

```bash
wopr channels add signal
```

### Via npm

```bash
npm install wopr-plugin-signal
```

### Manual Installation

```bash
git clone https://github.com/TSavo/wopr-plugin-signal.git
cd wopr-plugin-signal
npm install
npm run build
```

---

## ⚡ Quick Start

1. **Configure the plugin:**

```bash
wopr configure --plugin signal
```

2. **Edit your WOPR config** (`~/.wopr/config.yaml`):

```yaml
channels:
  signal:
    account: "+1234567890"  # Your Signal number
    autoStart: true         # Auto-start signal-cli daemon
    dmPolicy: "pairing"     # Allow pairing requests
```

3. **Start WOPR:**

```bash
wopr
```

The plugin will automatically connect to signal-cli and start receiving messages!

---

## ⚙️ Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `account` | string | **Required** | Your Signal phone number (E.164 format: +1234567890) |
| `cliPath` | string | `"signal-cli"` | Path to signal-cli executable |
| `httpHost` | string | `"127.0.0.1"` | Daemon HTTP host (use 127.0.0.1 for security) |
| `httpPort` | number | `8080` | Daemon HTTP port |
| `autoStart` | boolean | `true` | Auto-start signal-cli daemon |
| `dmPolicy` | string | `"pairing"` | DM handling: `allowlist`, `pairing`, `open`, `disabled` |
| `allowFrom` | array | `[]` | Allowed phone numbers/UUIDs for DMs |
| `groupPolicy` | string | `"allowlist"` | Group handling: `allowlist`, `open`, `disabled` |
| `groupAllowFrom` | array | `[]` | Allowed group IDs |
| `mediaMaxMb` | number | `8` | Maximum attachment size in MB |
| `ignoreAttachments` | boolean | `false` | Skip downloading attachments |
| `ignoreStories` | boolean | `false` | Ignore story updates |
| `sendReadReceipts` | boolean | `false` | Send read receipts |
| `receiveMode` | string | `"native"` | Message receive mode: `native` or `manually` |

### Full Configuration Example

```yaml
channels:
  signal:
    # Required
    account: "+1234567890"
    
    # Daemon settings
    cliPath: "/usr/local/bin/signal-cli"
    httpHost: "127.0.0.1"
    httpPort: 8080
    autoStart: true
    
    # Security policies
    dmPolicy: "allowlist"           # Only allow specific senders
    allowFrom:
      - "+15555550123"
      - "+15555550456"
      - "uuid:123e4567-e89b-12d3-a456-426614174000"
    
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "group:abc123..."
    
    # Media handling
    mediaMaxMb: 16
    ignoreAttachments: false
    ignoreStories: true
    sendReadReceipts: true
    receiveMode: "native"
```

### DM Policy Options

| Policy | Description |
|--------|-------------|
| `allowlist` | Only accept messages from numbers in `allowFrom` list |
| `pairing` | Accept all messages (default - WOPR handles pairing) |
| `open` | Accept all messages without restrictions |
| `disabled` | Reject all direct messages |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WOPR Core                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              wopr-plugin-signal                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │   │
│  │  │   Plugin    │◄──►│   Client    │◄──►│   Daemon   │  │   │
│  │  │   Core      │    │  (HTTP/SSE) │    │  Manager   │  │   │
│  │  └─────────────┘    └─────────────┘    └────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE (localhost)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     signal-cli Daemon                           │
│              ┌──────────────────────────────┐                  │
│              │  JSON-RPC API  │  SSE Stream  │                  │
│              └──────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Signal Protocol (TLS/WebSocket)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Signal Servers                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ End-to-End Encrypted
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Signal Clients                               │
│         (Phones, Desktop apps, Other signal-cli)                │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **signal-cli daemon** runs an HTTP server with JSON-RPC and SSE endpoints
2. **Plugin connects** to the daemon via HTTP on localhost
3. **Send messages** via JSON-RPC `send` method
4. **Receive messages** via SSE (Server-Sent Events) real-time stream
5. **Auto-reconnect** if the connection drops (with exponential backoff)

---

## 🐛 Troubleshooting

### Quick Diagnostics

```bash
# Check if signal-cli is installed
which signal-cli
signal-cli --version

# Check if account is registered
signal-cli listAccounts

# Test daemon manually
signal-cli daemon --http 127.0.0.1:8080

# Check daemon health
curl http://127.0.0.1:8080/api/v1/check
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `signal-cli not found` | Install signal-cli or set `cliPath` in config |
| `Daemon not starting` | Check if account is registered: `signal-cli listAccounts` |
| `Connection refused` | Verify daemon is running: `curl http://127.0.0.1:8080/api/v1/check` |
| `Messages not received` | Check `receiveMode` is not set to `manually` |
| `Account not registered` | Run `signal-cli register` or `signal-cli link` |

For detailed troubleshooting, see [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## 📚 Documentation

- **[INSTALL.md](docs/INSTALL.md)** - Detailed signal-cli installation per OS
- **[CONFIGURATION.md](docs/CONFIGURATION.md)** - Complete configuration reference
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[DOCKER.md](docs/DOCKER.md)** - Running signal-cli in Docker

### Examples

- **[Basic Config](examples/basic-config.json)** - Minimal working configuration
- **[Advanced Config](examples/advanced-config.json)** - Full-featured setup

---

## 🔒 Security

- ✅ **End-to-end encryption** via Signal protocol
- ✅ **Local-only HTTP daemon** (binds to 127.0.0.1 by default)
- ✅ **No message content logged** (only metadata)
- ✅ **Keys stored locally** by signal-cli
- ✅ **DM policies** for access control

### Security Best Practices

1. Always bind daemon to `127.0.0.1` (localhost only)
2. Use `dmPolicy: "allowlist"` for production bots
3. Keep signal-cli updated to latest version
4. Secure your `~/.local/share/signal-cli` directory

---

## 🤝 Contributing

Contributions are welcome! Please see the [WOPR repository](https://github.com/TSavo/wopr) for contribution guidelines.

---

## 🔗 Related Projects

- **[WOPR](https://github.com/TSavo/wopr)** - Main WOPR project
- **[signal-cli](https://github.com/AsamK/signal-cli)** - Signal CLI tool
- **[Signal Protocol](https://signal.org/docs/)** - Cryptography details

---

## 📄 License

MIT © [TSavo](https://github.com/TSavo)

---

<p align="center">
  <sub>Part of the <a href="https://github.com/TSavo/wopr">WOPR</a> ecosystem</sub>
</p>
