# 🐛 Troubleshooting Guide

Common issues and solutions for wopr-plugin-signal.

---

## 📋 Table of Contents

- [Quick Diagnostics](#-quick-diagnostics)
- [Installation Issues](#-installation-issues)
- [Registration Issues](#-registration-issues)
- [Daemon Issues](#-daemon-issues)
- [Connection Issues](#-connection-issues)
- [Message Issues](#-message-issues)
- [Performance Issues](#-performance-issues)
- [Getting Help](#-getting-help)

---

## 🔍 Quick Diagnostics

Run these commands to quickly diagnose issues:

```bash
# 1. Check signal-cli installation
which signal-cli
signal-cli --version

# 2. Check account registration
signal-cli listAccounts

# 3. Check daemon status
curl http://127.0.0.1:8080/api/v1/check

# 4. Check WOPR logs
tail -f ~/.wopr/logs/signal-plugin.log
tail -f ~/.wopr/logs/signal-plugin-error.log

# 5. Test manual daemon start
signal-cli daemon --http 127.0.0.1:8080 --verbose
```

---

## 📦 Installation Issues

### "signal-cli: command not found"

**Cause:** signal-cli is not in your PATH

**Solutions:**

1. **Check installation location:**
```bash
# Find signal-cli
find /opt /usr -name "signal-cli" 2>/dev/null

# If found in /opt, create symlink
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/signal-cli
```

2. **Add to PATH:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="/opt/signal-cli/bin:$PATH"

# Reload
source ~/.bashrc  # or ~/.zshrc
```

3. **Use absolute path in config:**
```yaml
channels:
  signal:
    cliPath: "/opt/signal-cli/bin/signal-cli"
```

### "UnsupportedClassVersionError"

**Cause:** Java version is too old (need Java 21+)

**Solution:**
```bash
# Check Java version
java -version

# Install Java 21 (Ubuntu/Debian)
sudo apt update
sudo apt install openjdk-21-jre

# Or use SDKMAN
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.5-tem
sdk use java 21.0.5-tem
```

### "Permission denied"

**Cause:** signal-cli binary lacks execute permissions

**Solution:**
```bash
# Fix permissions
chmod +x /opt/signal-cli/bin/signal-cli

# Or if using package manager install
sudo chmod +x $(which signal-cli)
```

---

## 📱 Registration Issues

### "Failed to register: Captcha required"

**Cause:** Signal requires captcha verification for new registrations

**Solution:**
```bash
# 1. Get captcha token from https://signalcaptchas.org/registration/generate.html
# 2. Use it in registration
signal-cli register --captcha YOUR_CAPTCHA_TOKEN

# 3. Verify with code
signal-cli verify 123456
```

### "Failed to register: Rate limit exceeded"

**Cause:** Too many registration attempts

**Solution:**
- Wait 24 hours before retrying
- Use voice verification instead: `signal-cli register --voice`
- Consider linking instead of registering: `signal-cli link`

### "Account already registered"

**Cause:** Number is already registered with signal-cli

**Solution:**
```bash
# Check registered accounts
signal-cli listAccounts

# If you need to re-register, unregister first
signal-cli unregister

# Then register again
signal-cli register
```

### "Linking failed: Device limit exceeded"

**Cause:** Signal allows maximum 5 linked devices

**Solution:**
1. Open Signal on your phone
2. Go to Settings → Linked Devices
3. Unlink old/inactive devices
4. Try linking again: `signal-cli link`

---

## 🔧 Daemon Issues

### "Daemon failed to start"

**Check these common causes:**

1. **Port already in use:**
```bash
# Check what's using port 8080
lsof -i :8080
netstat -tlnp | grep 8080

# Use a different port
signal-cli daemon --http 127.0.0.1:8081
```

2. **Account not registered:**
```bash
# Verify registration
signal-cli listAccounts

# If empty, register or link
signal-cli link
# or
signal-cli register
```

3. **Java not found:**
```bash
# Verify Java
java -version

# Set JAVA_HOME if needed
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### "Daemon started but connection refused"

**Cause:** Daemon is starting but not ready yet, or firewall issues

**Solution:**
```bash
# Wait a few seconds for daemon to be ready
sleep 5
curl http://127.0.0.1:8080/api/v1/check

# Check if daemon is actually listening
ps aux | grep signal-cli
netstat -tlnp | grep 8080

# Check firewall (should allow localhost)
sudo iptables -L | grep 8080
```

### "Daemon stops unexpectedly"

**Common causes:**

1. **Check logs for errors:**
```bash
# Run daemon manually with verbose output
signal-cli daemon --http 127.0.0.1:8080 --verbose

# Check for errors in output
```

2. **Out of memory:**
```bash
# Check memory usage
free -h

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

3. **Signal service issues:**
```bash
# Check if Signal servers are reachable
curl -I https://chat.signal.org
```

---

## 🔌 Connection Issues

### "Connection refused" error

**Diagnostics:**
```bash
# 1. Check if daemon is running
curl http://127.0.0.1:8080/api/v1/check

# 2. Check configuration
signal-cli --config ~/.local/share/signal-cli daemon --http 127.0.0.1:8080

# 3. Verify port in config matches
grep httpPort ~/.wopr/config.yaml
```

**Solutions:**

1. **Auto-start disabled:**
```yaml
# Enable auto-start
channels:
  signal:
    autoStart: true
```

2. **Wrong port/host:**
```yaml
# Ensure these match your daemon settings
channels:
  signal:
    httpHost: "127.0.0.1"
    httpPort: 8080
```

3. **Start daemon manually:**
```bash
signal-cli daemon --http 127.0.0.1:8080
```

### "SSE connection drops frequently"

**Cause:** Network instability or timeout issues

**Solutions:**

1. **Check network stability:**
```bash
# Monitor connection
ping -c 100 127.0.0.1

# Check for packet loss
```

2. **Increase timeout in WOPR config:**
The plugin has built-in retry with exponential backoff, but you can also:
```yaml
channels:
  signal:
    receiveMode: "native"  # More stable than manual
```

3. **Check for resource limits:**
```bash
# Check file descriptor limits
ulimit -n

# Increase if needed
ulimit -n 4096
```

---

## 💬 Message Issues

### "Messages not being received"

**Diagnostics:**
```bash
# 1. Check receive mode
signal-cli --config ~/.local/share/signal-cli receive --help

# 2. Test manual receive
signal-cli receive

# 3. Check SSE endpoint
curl -N http://127.0.0.1:8080/api/v1/events
```

**Solutions:**

1. **Wrong receive mode:**
```yaml
# Use native for automatic receiving
channels:
  signal:
    receiveMode: "native"  # NOT "manually"
```

2. **Daemon not running with correct account:**
```bash
# Start with account specified
signal-cli -a +1234567890 daemon --http 127.0.0.1:8080
```

3. **Check if messages are sync messages:**
```bash
# Some messages are sync messages from your phone
# The plugin automatically skips these
```

### "Messages not being sent"

**Diagnostics:**
```bash
# Test send manually
signal-cli send -m "Test message" +1234567890

# Check for rate limits
signal-cli send --help
```

**Common causes:**

1. **Rate limiting:**
   - Signal has rate limits for sending messages
   - Wait a few minutes and try again
   - Avoid sending too many messages quickly

2. **Invalid recipient:**
   - Ensure phone number format is correct: `+1234567890`
   - Verify recipient is on Signal

3. **Account issues:**
```bash
# Verify account is registered
signal-cli listAccounts

# Check account status
signal-cli -a +1234567890 getUserStatus +1234567890
```

### "Attachments not working"

**Solutions:**

1. **Check attachment size:**
```yaml
channels:
  signal:
    mediaMaxMb: 16  # Increase if needed
```

2. **Enable attachments:**
```yaml
channels:
  signal:
    ignoreAttachments: false
```

3. **Check file permissions:**
```bash
# Ensure signal-cli can read attachment directory
ls -la ~/.local/share/signal-cli/attachments/
```

---

## ⚡ Performance Issues

### "High CPU usage"

**Causes & Solutions:**

1. **Debug logging enabled:**
```yaml
# Reduce logging in WOPR config
# Edit ~/.wopr/config.yaml to set log level to 'info' or 'warn'
```

2. **Too many reconnections:**
```bash
# Check logs for reconnection loops
tail -f ~/.wopr/logs/signal-plugin.log | grep -i "retry\|reconnect"

# Stabilize network connection
# Consider using a more stable host
```

3. **Large message queues:**
```bash
# Check if there are stuck messages
signal-cli listContacts

# Restart daemon to clear queues
pkill -f signal-cli
signal-cli daemon --http 127.0.0.1:8080
```

### "High memory usage"

**Solutions:**

1. **Limit Java heap size:**
```bash
# Start daemon with memory limits
signal-cli daemon --http 127.0.0.1:8080 &
# Or set JAVA_OPTS
export JAVA_OPTS="-Xmx512m"
```

2. **Reduce attachment cache:**
```yaml
channels:
  signal:
    ignoreAttachments: true  # If you don't need attachments
```

---

## 📊 Log Analysis

### WOPR Plugin Logs

```bash
# View all logs
tail -f ~/.wopr/logs/signal-plugin.log

# View errors only
tail -f ~/.wopr/logs/signal-plugin-error.log

# Search for specific issues
grep -i "error\|fail\|warn" ~/.wopr/logs/signal-plugin.log
```

### signal-cli Logs

When running manually:
```bash
# Verbose output
signal-cli daemon --http 127.0.0.1:8080 --verbose

# Log to file
signal-cli daemon --http 127.0.0.1:8080 2>&1 | tee signal-cli.log
```

---

## 🆘 Getting Help

### Before Asking for Help

1. **Run diagnostics:**
```bash
# Gather system info
echo "=== signal-cli version ==="
signal-cli --version

echo "=== Java version ==="
java -version

echo "=== Registered accounts ==="
signal-cli listAccounts

echo "=== Process status ==="
ps aux | grep signal-cli

echo "=== Port status ==="
netstat -tlnp | grep 8080

echo "=== Recent logs ==="
tail -50 ~/.wopr/logs/signal-plugin.log
```

2. **Check existing issues:**
   - [WOPR Issues](https://github.com/TSavo/wopr/issues)
   - [signal-cli Issues](https://github.com/AsamK/signal-cli/issues)

### Where to Get Help

1. **WOPR Discord/Community:** For plugin-specific issues
2. **signal-cli GitHub:** For daemon/Signal protocol issues
3. **Signal Support:** For account/verification issues

### Reporting Bugs

When reporting bugs, include:
- signal-cli version: `signal-cli --version`
- Java version: `java -version`
- Operating system and version
- WOPR plugin version
- Relevant log excerpts (redact personal info)
- Steps to reproduce

---

## 🔗 Related Documentation

- [INSTALL.md](INSTALL.md) - Installation guide
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration reference
- [DOCKER.md](DOCKER.md) - Docker deployment
- [README.md](../README.md) - Main documentation
