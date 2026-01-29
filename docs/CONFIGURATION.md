# ⚙️ Configuration Reference

Complete configuration guide for wopr-plugin-signal.

---

## 📋 Table of Contents

- [Configuration File Location](#-configuration-file-location)
- [Configuration Schema](#-configuration-schema)
- [All Options](#-all-options)
- [DM Policies](#-dm-policies)
- [Group Policies](#-group-policies)
- [Examples](#-examples)
- [Environment Variables](#-environment-variables)

---

## 📁 Configuration File Location

WOPR uses YAML configuration files. The Signal plugin configuration is nested under the `channels.signal` key.

**Default locations:**
- `~/.wopr/config.yaml` (Linux/macOS)
- `%USERPROFILE%\.wopr\config.yaml` (Windows)

**Custom location:**
```bash
export WOPR_CONFIG=/path/to/config.yaml
```

---

## 📋 Configuration Schema

The plugin registers the following config schema with WOPR:

```typescript
interface SignalConfig {
  account?: string;                    // Signal phone number
  cliPath?: string;                    // Path to signal-cli
  httpHost?: string;                   // Daemon HTTP host
  httpPort?: number;                   // Daemon HTTP port
  httpUrl?: string;                    // Full daemon URL (optional)
  autoStart?: boolean;                 // Auto-start daemon
  dmPolicy?: "allowlist" | "pairing" | "open" | "disabled";
  allowFrom?: string[];                // Allowed senders for DMs
  groupAllowFrom?: string[];           // Allowed groups
  groupPolicy?: "allowlist" | "open" | "disabled";
  mediaMaxMb?: number;                 // Max attachment size
  ignoreAttachments?: boolean;         // Skip attachments
  ignoreStories?: boolean;             // Ignore story updates
  sendReadReceipts?: boolean;          // Send read receipts
  receiveMode?: "native" | "manually"; // Message receive mode
}
```

---

## 🔧 All Options

### Core Settings

#### `account`
- **Type:** `string`
- **Required:** Yes
- **Format:** E.164 phone number (`+1234567890`)
- **Description:** Your Signal phone number used for the bot

```yaml
channels:
  signal:
    account: "+1234567890"
```

#### `cliPath`
- **Type:** `string`
- **Default:** `"signal-cli"`
- **Description:** Path to the signal-cli executable

```yaml
channels:
  signal:
    cliPath: "/usr/local/bin/signal-cli"  # Custom path
    # OR
    cliPath: "signal-cli"                 # In PATH
```

### Daemon Settings

#### `httpHost`
- **Type:** `string`
- **Default:** `"127.0.0.1"`
- **Description:** Host for signal-cli HTTP daemon
- **Warning:** Use `"127.0.0.1"` for security. Only change if you understand the risks.

```yaml
channels:
  signal:
    httpHost: "127.0.0.1"
```

#### `httpPort`
- **Type:** `number`
- **Default:** `8080`
- **Range:** `1024-65535`
- **Description:** Port for signal-cli HTTP daemon

```yaml
channels:
  signal:
    httpPort: 8080
```

#### `httpUrl`
- **Type:** `string`
- **Optional:** Yes
- **Description:** Full URL to signal-cli daemon (overrides host/port)

```yaml
channels:
  signal:
    httpUrl: "http://localhost:8080"
    # OR for remote daemon (not recommended)
    httpUrl: "http://signal-daemon.internal:8080"
```

#### `autoStart`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Automatically start signal-cli daemon

```yaml
channels:
  signal:
    autoStart: true   # Plugin starts daemon automatically
    # OR
    autoStart: false  # You must start daemon manually
```

### Security Settings

#### `dmPolicy`
- **Type:** `string`
- **Default:** `"pairing"`
- **Options:** `"allowlist"`, `"pairing"`, `"open"`, `"disabled"`
- **Description:** How to handle direct messages

| Value | Description |
|-------|-------------|
| `allowlist` | Only accept messages from `allowFrom` list |
| `pairing` | Accept all, let WOPR handle pairing (default) |
| `open` | Accept all messages |
| `disabled` | Reject all DMs |

```yaml
channels:
  signal:
    dmPolicy: "allowlist"
    allowFrom:
      - "+15555550123"
      - "uuid:123e4567-e89b-12d3-a456-426614174000"
```

#### `allowFrom`
- **Type:** `string[]`
- **Default:** `[]`
- **Format:** Phone numbers (`+1234567890`) or UUIDs (`uuid:xxx`)
- **Description:** Allowed senders for direct messages

```yaml
channels:
  signal:
    dmPolicy: "allowlist"
    allowFrom:
      - "+15555550123"
      - "+15555550456"
      - "uuid:123e4567-e89b-12d3-a456-426614174000"
      - "*"  # Wildcard - allow all (use with caution)
```

#### `groupPolicy`
- **Type:** `string`
- **Default:** `"allowlist"`
- **Options:** `"allowlist"`, `"open"`, `"disabled"`
- **Description:** How to handle group messages

```yaml
channels:
  signal:
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "group:abc123..."
```

#### `groupAllowFrom`
- **Type:** `string[]`
- **Default:** `[]` (falls back to `allowFrom` if empty)
- **Description:** Allowed group IDs

```yaml
channels:
  signal:
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "group:abc123def456=="
      - "group:xyz789uvw012=="
```

### Media Settings

#### `mediaMaxMb`
- **Type:** `number`
- **Default:** `8`
- **Unit:** Megabytes
- **Description:** Maximum attachment size to process

```yaml
channels:
  signal:
    mediaMaxMb: 16   # 16MB max
```

#### `ignoreAttachments`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Don't download or process attachments

```yaml
channels:
  signal:
    ignoreAttachments: true   # Skip all attachments
```

#### `ignoreStories`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Ignore Signal story updates

```yaml
channels:
  signal:
    ignoreStories: true   # Don't process stories
```

### Receipt Settings

#### `sendReadReceipts`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Send read receipts to message senders

```yaml
channels:
  signal:
    sendReadReceipts: true   # Send read receipts
```

### Receive Mode

#### `receiveMode`
- **Type:** `string`
- **Default:** `"native"`
- **Options:** `"native"`, `"manually"`
- **Description:** How signal-cli receives messages

| Value | Description |
|-------|-------------|
| `native` | Daemon automatically receives messages (recommended) |
| `manually` | You must call `signal-cli receive` manually |

```yaml
channels:
  signal:
    receiveMode: "native"   # Auto-receive
```

---

## 🔒 DM Policies

### Allowlist Mode

Only specified numbers can message the bot:

```yaml
channels:
  signal:
    dmPolicy: "allowlist"
    allowFrom:
      - "+15555550123"
      - "+15555550456"
```

### Pairing Mode (Default)

Accept all messages, let WOPR's pairing system handle authorization:

```yaml
channels:
  signal:
    dmPolicy: "pairing"
```

### Open Mode

Accept all messages without restriction:

```yaml
channels:
  signal:
    dmPolicy: "open"
```

### Disabled Mode

Reject all direct messages:

```yaml
channels:
  signal:
    dmPolicy: "disabled"
```

---

## 👥 Group Policies

### Allowlist Mode (Default)

Only specified groups can include the bot:

```yaml
channels:
  signal:
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "group:abc123..."
```

### Open Mode

Work in all groups:

```yaml
channels:
  signal:
    groupPolicy: "open"
```

### Disabled Mode

Don't participate in any groups:

```yaml
channels:
  signal:
    groupPolicy: "disabled"
```

---

## 📝 Examples

### Minimal Configuration

```yaml
channels:
  signal:
    account: "+1234567890"
```

### Development Setup

```yaml
channels:
  signal:
    account: "+1234567890"
    autoStart: true
    dmPolicy: "open"        # Accept all during development
    groupPolicy: "open"
    sendReadReceipts: false # Don't send receipts while testing
```

### Production Setup

```yaml
channels:
  signal:
    account: "+1234567890"
    cliPath: "/usr/local/bin/signal-cli"
    httpHost: "127.0.0.1"
    httpPort: 8080
    autoStart: true
    
    # Security
    dmPolicy: "allowlist"
    allowFrom:
      - "+15555550123"
      - "+15555550456"
    
    groupPolicy: "allowlist"
    groupAllowFrom:
      - "group:abc123..."
    
    # Media
    mediaMaxMb: 8
    ignoreAttachments: false
    ignoreStories: true
    sendReadReceipts: true
```

### High-Security Setup

```yaml
channels:
  signal:
    account: "+1234567890"
    autoStart: true
    
    # Strict security
    dmPolicy: "allowlist"
    allowFrom:
      - "+15555550123"  # Only specific admin
    
    groupPolicy: "disabled"  # No group participation
    
    # Minimal attack surface
    ignoreAttachments: true   # No file handling
    ignoreStories: true
    sendReadReceipts: false
    
    # Network
    httpHost: "127.0.0.1"
    httpPort: 8080
```

---

## 🌍 Environment Variables

Some settings can be overridden via environment variables:

| Variable | Description |
|----------|-------------|
| `WOPR_HOME` | Base directory for WOPR files (`~/.wopr`) |
| `SIGNAL_CLI_PATH` | Path to signal-cli executable |
| `SIGNAL_ACCOUNT` | Signal phone number |

Example:
```bash
export WOPR_HOME=/var/lib/wopr
export SIGNAL_CLI_PATH=/opt/signal-cli/bin/signal-cli
export SIGNAL_ACCOUNT="+1234567890"
```

---

## 🔗 Related Documentation

- [INSTALL.md](INSTALL.md) - signal-cli installation
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [DOCKER.md](DOCKER.md) - Docker deployment
- [README.md](../README.md) - Main documentation
