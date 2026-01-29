# 📦 signal-cli Installation Guide

Complete guide for installing signal-cli on various operating systems.

---

## 📋 Table of Contents

- [Requirements](#-requirements)
- [macOS](#-macos)
- [Linux](#-linux)
  - [Ubuntu/Debian](#ubuntudebian)
  - [Arch Linux](#arch-linux)
  - [Fedora/RHEL](#fedorarhel)
  - [NixOS](#nixos)
- [Windows (WSL)](#-windows-wsl)
- [Building from Source](#-building-from-source)
- [Verification](#-verification)

---

## 📋 Requirements

- **Java 21+** (Required for signal-cli)
- **Phone number** capable of receiving SMS or voice calls (for registration)
- **~100MB** disk space

---

## 🍎 macOS

### Using Homebrew (Recommended)

```bash
# Install signal-cli
brew install signal-cli

# Verify installation
signal-cli --version
```

### Manual Installation

```bash
# Download latest release
# Visit https://github.com/AsamK/signal-cli/releases for latest version
VERSION="0.13.12"
curl -L -o signal-cli.tar.gz \
  "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-macOS-x86_64.tar.gz"

# Extract
tar -xzf signal-cli.tar.gz

# Move to system location
sudo mv signal-cli-${VERSION} /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/signal-cli

# Verify
signal-cli --version
```

### Java Installation (if needed)

```bash
# Check if Java 21+ is installed
java -version

# Install via Homebrew if needed
brew install openjdk@21
```

---

## 🐧 Linux

### Ubuntu/Debian

#### Method 1: Using Pre-built Binary (Recommended)

```bash
# Download latest release
# Check https://github.com/AsamK/signal-cli/releases for latest version
VERSION="0.13.12"
ARCH="x86_64"  # Change to "aarch64" for ARM64

wget "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-linux-${ARCH}.tar.gz"

# Extract
tar -xzf "signal-cli-${VERSION}-linux-${ARCH}.tar.gz"

# Install to system
sudo mv "signal-cli-${VERSION}" /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/

# Verify
signal-cli --version
```

#### Method 2: Using Package Manager (Third-party)

```bash
# Some distributions have signal-cli in their repos
# Note: These may be outdated versions

# Debian/Ubuntu (if available)
sudo apt update
sudo apt install signal-cli

# Or use Snap (community maintained)
sudo snap install signal-cli
```

#### Install Java 21

```bash
# Ubuntu 24.04+ (has Java 21 by default)
sudo apt update
sudo apt install openjdk-21-jre

# Ubuntu 22.04 and earlier
sudo apt update
sudo apt install wget apt-transport-https
mkdir -p /etc/apt/keyrings
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo tee /etc/apt/keyrings/adoptium.asc
echo "deb [signed-by=/etc/apt/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install temurin-21-jre
```

### Arch Linux

#### Using AUR (Recommended)

```bash
# Using yay
yay -S signal-cli

# Or using paru
paru -S signal-cli

# Or manually
git clone https://aur.archlinux.org/signal-cli.git
cd signal-cli
makepkg -si
```

#### Using pacman (community repo)

```bash
# Some versions may be in community repo
sudo pacman -S signal-cli
```

### Fedora/RHEL

```bash
# Download and install manually (same as Ubuntu)
VERSION="0.13.12"
ARCH="x86_64"

wget "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-linux-${ARCH}.tar.gz"
tar -xzf "signal-cli-${VERSION}-linux-${ARCH}.tar.gz"
sudo mv "signal-cli-${VERSION}" /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/

# Install Java 21
sudo dnf install java-21-openjdk

# Verify
signal-cli --version
```

### NixOS

```bash
# Using nix-env
nix-env -iA nixpkgs.signal-cli

# Or add to configuration.nix
environment.systemPackages = with pkgs; [
  signal-cli
];
```

---

## 🪟 Windows (WSL)

signal-cli requires a Unix-like environment. Use WSL2:

```bash
# In WSL2 Ubuntu - follow Ubuntu instructions above
wsl --install -d Ubuntu

# Then inside WSL:
# 1. Install Java
sudo apt update
sudo apt install openjdk-21-jre

# 2. Download signal-cli
VERSION="0.13.12"
wget "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-linux-x86_64.tar.gz"
tar -xzf "signal-cli-${VERSION}-linux-x86_64.tar.gz"
sudo mv "signal-cli-${VERSION}" /opt/signal-cli
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/

# Verify
signal-cli --version
```

---

## 🔨 Building from Source

### Prerequisites

- Java JDK 21+
- Gradle 8+

### Build Steps

```bash
# Clone repository
git clone https://github.com/AsamK/signal-cli.git
cd signal-cli

# Build with Gradle
./gradlew build

# Create distribution
./gradlew installDist

# The built binary will be in:
# build/install/signal-cli/bin/signal-cli

# Install to system (optional)
sudo cp -r build/install/signal-cli /opt/
sudo ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/
```

---

## ✅ Verification

After installation, verify signal-cli works:

```bash
# Check version
signal-cli --version
# Expected: signal-cli 0.13.12

# Check account status
signal-cli listAccounts

# Get help
signal-cli --help
```

### Common Verification Issues

| Issue | Solution |
|-------|----------|
| `command not found` | Check PATH or use full path: `/opt/signal-cli/bin/signal-cli` |
| `java: command not found` | Install Java 21+ |
| `UnsupportedClassVersionError` | Upgrade to Java 21+ |

---

## 📝 Next Steps

After installing signal-cli, you need to register or link your Signal account:

```bash
# Link existing device (recommended)
signal-cli link

# Or register new number
signal-cli register
```

See [CONFIGURATION.md](CONFIGURATION.md) for WOPR plugin configuration.

---

## 🔗 Resources

- [signal-cli Releases](https://github.com/AsamK/signal-cli/releases)
- [signal-cli Documentation](https://github.com/AsamK/signal-cli/wiki)
- [WOPR Signal Plugin](../README.md)
