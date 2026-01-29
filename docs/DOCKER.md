# 🐳 Docker Deployment Guide

Running signal-cli and wopr-plugin-signal in Docker containers.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Docker Compose](#-docker-compose)
- [Configuration](#-configuration)
- [Volume Mounts](#-volume-mounts)
- [Networking](#-networking)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Using Pre-built Image

```bash
# Pull signal-cli image
docker pull registry.gitlab.com/packaging/signal-cli/signal-cli:latest

# Run signal-cli daemon
docker run -d \
  --name signal-cli \
  -p 127.0.0.1:8080:8080 \
  -v signal-data:/home/signal/.local/share/signal-cli \
  registry.gitlab.com/packaging/signal-cli/signal-cli:latest \
  daemon --http 0.0.0.0:8080
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  signal-cli:
    image: registry.gitlab.com/packaging/signal-cli/signal-cli:latest
    container_name: signal-cli
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - signal-data:/home/signal/.local/share/signal-cli
      - ./config:/config:ro
    command: >
      daemon 
      --http 0.0.0.0:8080
      --receive-mode native
    restart: unless-stopped
    # Security: Run as non-root
    user: "1000:1000"

volumes:
  signal-data:
```

Start the container:
```bash
docker-compose up -d

# Check logs
docker-compose logs -f signal-cli

# Verify daemon is ready
curl http://127.0.0.1:8080/api/v1/check
```

---

## 🔄 Docker Compose (Full Stack)

Complete setup with WOPR and signal-cli:

```yaml
version: '3.8'

services:
  signal-cli:
    image: registry.gitlab.com/packaging/signal-cli/signal-cli:latest
    container_name: signal-cli
    ports:
      - "8080:8080"
    volumes:
      - signal-data:/home/signal/.local/share/signal-cli
    environment:
      - SIGNAL_ACCOUNT=${SIGNAL_ACCOUNT}
    command: >
      daemon 
      --http 0.0.0.0:8080
      --receive-mode native
      --no-receive-stdout
    restart: unless-stopped
    networks:
      - wopr-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: WOPR in Docker
  wopr:
    image: tsavo/wopr:latest
    container_name: wopr
    volumes:
      - wopr-data:/root/.wopr
      - ./wopr-config:/config:ro
    environment:
      - WOPR_CONFIG=/config/config.yaml
      - SIGNAL_HTTP_URL=http://signal-cli:8080
    ports:
      - "3000:3000"
    depends_on:
      signal-cli:
        condition: service_healthy
    networks:
      - wopr-network
    restart: unless-stopped

volumes:
  signal-data:
    driver: local
  wopr-data:
    driver: local

networks:
  wopr-network:
    driver: bridge
```

`.env` file:
```bash
SIGNAL_ACCOUNT=+1234567890
```

---

## ⚙️ Configuration

### Building Custom Image

Create a `Dockerfile`:

```dockerfile
FROM registry.gitlab.com/packaging/signal-cli/signal-cli:latest

# Install curl for healthchecks
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Switch back to signal user
USER signal

# Expose daemon port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/check || exit 1

# Default command
CMD ["daemon", "--http", "0.0.0.0:8080", "--receive-mode", "native"]
```

Build and run:
```bash
docker build -t my-signal-cli .

docker run -d \
  --name signal-cli \
  -p 127.0.0.1:8080:8080 \
  -v signal-data:/home/signal/.local/share/signal-cli \
  my-signal-cli
```

### Multi-stage Build (Optimized)

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder

ARG SIGNAL_CLI_VERSION=0.13.12

RUN apk add --no-cache wget tar

WORKDIR /tmp
RUN wget "https://github.com/AsamK/signal-cli/releases/download/v${SIGNAL_CLI_VERSION}/signal-cli-${SIGNAL_CLI_VERSION}-linux-x86_64.tar.gz" && \
    tar -xzf "signal-cli-${SIGNAL_CLI_VERSION}-linux-x86_64.tar.gz"

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

ARG SIGNAL_CLI_VERSION=0.13.12

RUN apk add --no-cache curl

# Create signal user
RUN adduser -D -s /bin/sh signal

# Copy signal-cli
COPY --from=builder /tmp/signal-cli-${SIGNAL_CLI_VERSION} /opt/signal-cli
RUN ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/

# Set up directories
RUN mkdir -p /home/signal/.local/share/signal-cli && \
    chown -R signal:signal /home/signal

USER signal
WORKDIR /home/signal

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/check || exit 1

# Run daemon
CMD ["signal-cli", "daemon", "--http", "0.0.0.0:8080"]
```

---

## 💾 Volume Mounts

### Persistent Data

signal-cli stores keys and data in specific locations:

```bash
# Docker volume (recommended)
docker volume create signal-data

docker run -d \
  --name signal-cli \
  -v signal-data:/home/signal/.local/share/signal-cli \
  -p 127.0.0.1:8080:8080 \
  signal-cli-image
```

### Bind Mount (for access from host)

```bash
# Create local directory
mkdir -p ~/.signal-cli/data

# Run with bind mount
docker run -d \
  --name signal-cli \
  -v ~/.signal-cli/data:/home/signal/.local/share/signal-cli \
  -p 127.0.0.1:8080:8080 \
  signal-cli-image
```

### Mount Points Reference

| Host Path | Container Path | Description |
|-----------|----------------|-------------|
| `signal-data` | `/home/signal/.local/share/signal-cli` | signal-cli data (keys, config) |
| `./config` | `/config` | Read-only configuration |
| `./logs` | `/home/signal/logs` | Log files |

---

## 🌐 Networking

### Port Mapping

```yaml
# docker-compose.yml
services:
  signal-cli:
    ports:
      # Localhost only (secure)
      - "127.0.0.1:8080:8080"
      
      # OR specific interface
      - "192.168.1.100:8080:8080"
      
      # All interfaces (not recommended)
      - "8080:8080"
```

### Inter-container Communication

WOPR and signal-cli in same network:

```yaml
version: '3.8'

services:
  signal-cli:
    image: signal-cli:latest
    networks:
      - wopr-net
    # No ports exposed externally
    expose:
      - "8080"

  wopr:
    image: wopr:latest
    environment:
      # Use service name as hostname
      - SIGNAL_HTTP_URL=http://signal-cli:8080
    networks:
      - wopr-net

networks:
  wopr-net:
    internal: true  # No external access
```

WOPR config:
```yaml
channels:
  signal:
    account: "+1234567890"
    httpUrl: "http://signal-cli:8080"  # Docker service name
    autoStart: false  # Don't try to spawn daemon
```

---

## 🔒 Security

### Non-root User

Always run signal-cli as non-root:

```dockerfile
# Create dedicated user
RUN adduser -D -s /bin/sh signal
USER signal
```

### Network Isolation

```yaml
version: '3.8'

services:
  signal-cli:
    image: signal-cli:latest
    networks:
      - backend
    # No external ports
    expose:
      - "8080"
    
  wopr:
    image: wopr:latest
    networks:
      - backend
      - frontend
    ports:
      - "3000:3000"

networks:
  backend:
    internal: true  # Isolated from external
  frontend:
    # External access for WOPR
```

### Read-only Root Filesystem

```yaml
services:
  signal-cli:
    image: signal-cli:latest
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - signal-data:/home/signal/.local/share/signal-cli
```

### Security Options

```yaml
services:
  signal-cli:
    image: signal-cli:latest
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to privileged port
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs signal-cli

# Run interactively for debugging
docker run -it --rm signal-cli-image /bin/sh

# Check inside container
docker exec -it signal-cli /bin/sh
```

### Permission Issues

```bash
# Fix ownership on host
sudo chown -R 1000:1000 ~/.signal-cli/data

# Or run container as current user
docker run -d \
  --user $(id -u):$(id -g) \
  -v ~/.signal-cli/data:/home/signal/.local/share/signal-cli \
  signal-cli-image
```

### Network Issues

```bash
# Test connectivity from WOPR container
docker exec wopr curl http://signal-cli:8080/api/v1/check

# Check container networking
docker network inspect wopr-network
```

### Data Persistence Issues

```bash
# Verify data is persisted
docker exec signal-cli ls -la /home/signal/.local/share/signal-cli/

# Backup data
docker run --rm \
  -v signal-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/signal-backup.tar.gz -C /data .

# Restore data
docker run --rm \
  -v signal-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/signal-backup.tar.gz -C /data
```

---

## 📚 Examples

### Minimal Docker Setup

```bash
# 1. Create data directory
mkdir -p ~/.signal-cli

# 2. Run daemon
docker run -d \
  --name signal-cli \
  --restart unless-stopped \
  -v ~/.signal-cli:/home/signal/.local/share/signal-cli \
  -p 127.0.0.1:8080:8080 \
  registry.gitlab.com/packaging/signal-cli/signal-cli:latest \
  daemon --http 0.0.0.0:8080

# 3. Register (one-time)
docker exec -it signal-cli signal-cli register

# 4. Verify
curl http://127.0.0.1:8080/api/v1/check
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  signal-cli:
    image: registry.gitlab.com/packaging/signal-cli/signal-cli:latest
    container_name: signal-cli
    restart: unless-stopped
    
    # Security
    read_only: true
    user: "1000:1000"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    
    # Networking
    ports:
      - "127.0.0.1:8080:8080"
    networks:
      - wopr-internal
    
    # Storage
    volumes:
      - type: volume
        source: signal-data
        target: /home/signal/.local/share/signal-cli
      - type: tmpfs
        target: /tmp
    
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

volumes:
  signal-data:
    driver: local

networks:
  wopr-internal:
    internal: true
```

---

## 🔗 Related Documentation

- [INSTALL.md](INSTALL.md) - Installation guide
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration reference
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [README.md](../README.md) - Main documentation
