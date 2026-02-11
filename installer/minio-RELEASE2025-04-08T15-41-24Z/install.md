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

---

## 5. Bucket Setup and Credentials Demo

This section uses `mc` (MinIO Client) to create:
- one **public bucket** (readable without keys)
- one **private bucket** (requires dedicated access keys)

### 5.1 Install MinIO Client (`mc`)

```bash
curl -LO https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
mc --version
```

### 5.2 Configure `mc` Alias

```bash
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin123456
```

> Replace credentials if you changed `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`.

### 5.3 Create Buckets

```bash
mc mb local/public-assets
mc mb local/private-docs
```

### 5.4 Public Bucket (Read-Only Public Access)

Set anonymous download access:

```bash
mc anonymous set download local/public-assets
```

Quick verification:

```bash
echo "hello public world" > demo.txt
mc cp demo.txt local/public-assets/
curl http://127.0.0.1:9000/public-assets/demo.txt
```

Expected: file content is returned without credentials.

### 5.5 Private Bucket (Dedicated Keys Required)

1. Create a service account for private access:

```bash
mc admin user svcacct add \
  --access-key private-docs-ak \
  --secret-key 'ChangeThisToAStrongSecretKey123!' \
  local minioadmin
```

2. Create a bucket-scoped read/write policy:

```bash
cat > private-docs-rw.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::private-docs"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::private-docs/*"
      ]
    }
  ]
}
EOF
```

3. Register and attach the policy to the service account:

```bash
mc admin policy create local private-docs-rw private-docs-rw.json
mc admin policy attach local private-docs-rw --user private-docs-ak
```

4. Test private key access:

```bash
mc alias set privatedocs http://127.0.0.1:9000 private-docs-ak 'ChangeThisToAStrongSecretKey123!'
mc cp demo.txt privatedocs/private-docs/
mc ls privatedocs/private-docs
```

Expected: works only with the private keys. Anonymous access should fail:

```bash
curl -I http://127.0.0.1:9000/private-docs/demo.txt
```

Expected: `403 Forbidden`.

### 5.6 S3 Client Credential Example

Use these values in apps/SDKs:

- `endpoint`: `http://<SERVER-IP>:9000`
- `region`: `us-east-1` (default for many MinIO setups)
- `accessKey`: `private-docs-ak`
- `secretKey`: `ChangeThisToAStrongSecretKey123!`
- `forcePathStyle`: `true` (often needed for S3-compatible clients)

> Production note: never keep sample keys. Rotate keys and use strong secrets.

---

## 6. Tutorial: Change MinIO Version (Binary Install)

Use this if you installed MinIO as a native binary (`/usr/local/bin/minio`) and want to upgrade or downgrade to a specific release.

### 6.1 Check Current Version and Service State

```bash
minio --version
sudo systemctl status minio --no-pager
```

### 6.2 Pick Target Version

Example target (same as this guide):

```bash
TARGET_VERSION="RELEASE.2025-04-08T15-41-24Z"
```

If you want to keep your current newer release, set:

```bash
TARGET_VERSION="RELEASE.2025-09-07T16-13-09Z"
```

### 6.3 Download Target Binary

```bash
cd /tmp
curl -fLO "https://dl.min.io/server/minio/release/linux-amd64/archive/minio.${TARGET_VERSION}"
chmod +x "minio.${TARGET_VERSION}"
```

### 6.4 Stop Service and Backup Current Binary

```bash
sudo systemctl stop minio
sudo cp /usr/local/bin/minio "/usr/local/bin/minio.bak.$(date +%F-%H%M%S)"
```

### 6.5 Replace Binary and Start Service

```bash
sudo mv "minio.${TARGET_VERSION}" /usr/local/bin/minio
sudo chown root:root /usr/local/bin/minio
sudo chmod 755 /usr/local/bin/minio

sudo systemctl start minio
sudo systemctl status minio --no-pager
minio --version
```

### 6.6 Quick Rollback (If Needed)

If service fails after version change, restore the latest backup:

```bash
sudo systemctl stop minio
sudo ls -1t /usr/local/bin/minio.bak.* | head -n 1
sudo cp "$(sudo ls -1t /usr/local/bin/minio.bak.* | head -n 1)" /usr/local/bin/minio
sudo chmod 755 /usr/local/bin/minio
sudo systemctl start minio
sudo systemctl status minio --no-pager
```

---

## 7. Tutorial: Fully Uninstall MinIO (Binary Install)

Use this when you want a clean reinstall and do not need to keep data/config.

> Warning: this permanently deletes MinIO data at `/data-storage/minio`.

### 7.1 Stop and Remove systemd Service

```bash
sudo systemctl stop minio || true
sudo systemctl disable minio || true
sudo rm -f /etc/systemd/system/minio.service
sudo systemctl daemon-reload
```

### 7.2 Remove Binary and Environment File

```bash
sudo rm -f /usr/local/bin/minio
sudo rm -f /etc/default/minio
```

### 7.3 Remove MinIO User (Optional)

```bash
sudo userdel minio-user || true
```

### 7.4 Remove MinIO Data

```bash
sudo rm -rf /data-storage/minio
```

### 7.5 Remove Old Binary Backups (Optional)

```bash
sudo rm -f /usr/local/bin/minio.bak.*
```

---

## 8. Optional: Nginx Reverse Proxy (Public Web Server -> Private MinIO)

Use this when MinIO runs on a private server (example: `10.10.10.20`) and you want one centralized public server with Nginx.

Recommended:
- `s3.example.com` -> MinIO S3 API (`:9000`)
- `minio-console.example.com` -> MinIO Console (`:9001`)

### 8.1 Install Nginx on Public Web Server

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

### 8.2 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/minio-proxy
```

Paste this config (replace domain and private IP):

```nginx
upstream minio_s3 {
    server 10.10.10.20:9000;
}

upstream minio_console {
    server 10.10.10.20:9001;
}

server {
    listen 80;
    server_name s3.example.com;

    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_pass http://minio_s3;
    }
}

server {
    listen 80;
    server_name minio-console.example.com;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://minio_console;
    }
}
```

### 8.3 Enable Site and Validate

```bash
sudo ln -s /etc/nginx/sites-available/minio-proxy /etc/nginx/sites-enabled/minio-proxy
sudo nginx -t
sudo systemctl reload nginx
```

### 8.4 Optional TLS (Recommended)

Use Let's Encrypt for both domains:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d s3.example.com -d minio-console.example.com
```

### 8.5 MinIO Environment Note Behind Proxy

If using public domain names, set in `/etc/default/minio`:

```bash
MINIO_SERVER_URL="https://s3.example.com"
MINIO_BROWSER_REDIRECT_URL="https://minio-console.example.com"
```

Then restart MinIO:

```bash
sudo systemctl restart minio
```
