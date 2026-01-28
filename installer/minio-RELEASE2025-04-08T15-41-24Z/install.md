# MinIO Installation Guide

**Version:** RELEASE.2025-04-08T15-41-24Z  
**Storage Path:** `/data-storage/minio`  
**Mode:** Single Node / Standalone  
**OS:** Debian & Ubuntu

---

## 1. OS Compatibility (Minimum Version)

### Debian

| Debian Version | Codename | Status |
|----------------|----------|--------|
| Debian 10 | Buster | ❌ Not Recommended (glibc borderline) |
| Debian 11 | Bullseye | ✅ Minimum Supported |
| Debian 12 | Bookworm | ✅ Recommended |

### Ubuntu

| Ubuntu Version | Codename | Status |
|----------------|----------|--------|
| Ubuntu 18.04 | Bionic | ❌ Not Recommended |
| Ubuntu 20.04 | Focal | ✅ Minimum Supported |
| Ubuntu 22.04 | Jammy | ✅ Recommended |
| Ubuntu 24.04 | Noble | ✅ Recommended |

---

## 2. Installation Method A (Recommended): Docker Compose

### 2.1 Install Docker & Docker Compose Plugin

**Debian / Ubuntu:**

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo apt install -y docker-compose-plugin
```

**Optional – Avoid sudo:**

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2.2 Prepare Custom Storage Directory

```bash
sudo mkdir -p /data-storage/minio
sudo chown -R 1000:1000 /data-storage/minio
```

> **Note:** `1000:1000` is safe for MinIO container (non-root).

### 2.3 Create docker-compose.yml

```yaml
version: "3.9"

services:
  minio:
    image: minio/minio:RELEASE.2025-04-08T15-41-24Z
    container_name: minio
    command: server /data --address ":9000" --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123456
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web Console
    volumes:
      - /data-storage/minio:/data
    restart: unless-stopped
```

### 2.4 Start MinIO

```bash
docker compose up -d
docker logs -f minio
```

### 2.5 Access

- **S3 API:** `http://<SERVER-IP>:9000`
- **Web Console:** `http://<SERVER-IP>:9001`

---

## 3. Installation Method B: Native Binary + systemd (No Docker)

### 3.1 Create MinIO System User

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin minio-user
```

### 3.2 Prepare Custom Storage

```bash
sudo mkdir -p /data-storage/minio
sudo chown -R minio-user:minio-user /data-storage/minio
```

### 3.3 Download MinIO Binary

```bash
curl -LO https://dl.min.io/server/minio/release/linux-amd64/archive/minio.RELEASE.2025-04-08T15-41-24Z
sudo chmod +x minio.RELEASE.2025-04-08T15-41-24Z
sudo mv minio.RELEASE.2025-04-08T15-41-24Z /usr/local/bin/minio
```

**Verify:**

```bash
minio --version
```

### 3.4 Create Environment File

```bash
sudo nano /etc/default/minio
```

Add the following content:

```bash
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin123456"

MINIO_VOLUMES="/data-storage/minio"
MINIO_OPTS="--address :9000 --console-address :9001"
```

### 3.5 Create systemd Service

```bash
sudo nano /etc/systemd/system/minio.service
```

Add the following content:

```ini
[Unit]
Description=MinIO Object Storage
Wants=network-online.target
After=network-online.target

[Service]
User=minio-user
Group=minio-user
EnvironmentFile=-/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

### 3.6 Enable & Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
sudo systemctl status minio --no-pager
```

### 3.7 Access

- **S3 API:** `http://<SERVER-IP>:9000`
- **Web Console:** `http://<SERVER-IP>:9001`

---

## 4. Post-Install Checklist

- ✔ Storage mounted at `/data-storage/minio`
- ✔ Ports 9000 & 9001 open
- ✔ Credentials set (not default in production)
- ✔ Service auto-start enabled
