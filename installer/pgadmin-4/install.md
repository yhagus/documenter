# pgAdmin Installation Guide (Web Mode with NGINX)

**Platform:** Ubuntu/Debian  
**pgAdmin Mode:** Web (accessible via browser)  
**Web Server:** NGINX  
**Default Port:** 5050

---

## 1. Install Basic Dependencies

```bash
sudo apt update
sudo apt -y install curl ca-certificates gnupg nginx
```

---

## 2. Add Official pgAdmin Repository

### a) Import GPG Key

```bash
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub \
| sudo gpg --dearmor -o /usr/share/keyrings/pgadmin.gpg
```

### b) Add pgAdmin Repository

```bash
echo "deb [signed-by=/usr/share/keyrings/pgadmin.gpg] \
https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/noble pgadmin4 main" \
| sudo tee /etc/apt/sources.list.d/pgadmin4.list
```

> **Note:** `noble` = Ubuntu 24.04. Adjust for your Ubuntu version if needed.

---

## 3. Update Repository & Install pgAdmin (Desktop/Web)

```bash
sudo apt update
sudo apt -y install pgadmin4-desktop pgadmin4-web
```

---

## 4. Configure pgAdmin to Run as a Web Service

### Create pgAdmin Configuration Directory

```bash
sudo mkdir -p /var/lib/pgadmin
sudo mkdir -p /var/log/pgadmin
sudo chown -R www-data:www-data /var/lib/pgadmin
sudo chown -R www-data:www-data /var/log/pgadmin
```

### Create pgAdmin Configuration File

```bash
sudo nano /var/lib/pgadmin/config_local.py
```

Add the following content:

```python
import os
DATA_DIR = '/var/lib/pgadmin'
LOG_FILE = '/var/log/pgadmin/pgadmin4.log'
SQLITE_PATH = os.path.join(DATA_DIR, 'pgadmin4.db')
SESSION_DB_PATH = os.path.join(DATA_DIR, 'sessions')
STORAGE_DIR = os.path.join(DATA_DIR, 'storage')
SERVER_MODE = True
```

### Set Proper Permissions

```bash
sudo chown www-data:www-data /var/lib/pgadmin/config_local.py
```

---

## 5. Create pgAdmin Systemd Service

```bash
sudo nano /etc/systemd/system/pgadmin4.service
```

Add the following content:

```ini
[Unit]
Description=pgAdmin4
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Environment="PGADMIN_SETUP_EMAIL=admin@example.com"
Environment="PGADMIN_SETUP_PASSWORD=CHANGE_THIS_PASSWORD"
WorkingDirectory=/usr/pgadmin4
ExecStart=/usr/pgadmin4/venv/bin/python3 /usr/pgadmin4/web/pgAdmin4.py
Restart=always

[Install]
WantedBy=multi-user.target
```

> **Important:** Change `CHANGE_THIS_PASSWORD` to a strong password.

### Enable and Start pgAdmin Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable pgadmin4
sudo systemctl start pgadmin4
```

### Check Service Status

```bash
sudo systemctl status pgadmin4 --no-pager
```

---

## 6. Configure NGINX as Reverse Proxy

### Create NGINX Configuration for pgAdmin

```bash
sudo nano /etc/nginx/sites-available/pgadmin
```

Add the following content:

```nginx
server {
    listen 5050;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Alternative: Run pgAdmin Directly via Gunicorn

If you prefer to run pgAdmin via Gunicorn (more stable), update the systemd service:

```bash
sudo nano /etc/systemd/system/pgadmin4.service
```

Replace `ExecStart` line with:

```ini
ExecStart=/usr/pgadmin4/venv/bin/gunicorn --bind 127.0.0.1:5050 --workers=1 --threads=25 --chdir /usr/pgadmin4/web pgAdmin4:app
```

Then update NGINX config to match the Gunicorn port.

### Enable NGINX Site

```bash
sudo ln -s /etc/nginx/sites-available/pgadmin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Verify Services are Running

### Check pgAdmin Service

```bash
sudo systemctl status pgadmin4 --no-pager
```

### Check NGINX Status

```bash
sudo systemctl status nginx --no-pager
```

### Check Listening Port

```bash
sudo ss -lntp | grep 5050
```

---

## 8. Initialize pgAdmin Database

Run the setup script to create the initial database:

```bash
sudo /usr/pgadmin4/venv/bin/python3 /usr/pgadmin4/web/setup.py
```

You will be prompted for:

- **Email address:** `admin@example.com` (or your preferred email)
- **Password:** (choose a strong password)

> 📌 **Important:** Save this email & password → used for pgAdmin login.

Then restart the pgAdmin service:

```bash
sudo systemctl restart pgadmin4
```

---

## 9. Access pgAdmin from Browser

Open your browser and navigate to:

```
http://IP_VM:5050
```

### Login Credentials

- **Email:** (the one you set during database initialization)
- **Password:** (the one you set during database initialization)

---

## 10. Connect pgAdmin to Your PostgreSQL Server

### In pgAdmin UI:

1. Click **Add New Server**

### Tab: General

- **Name:** `Local PostgreSQL`

### Tab: Connection

- **Host name/address:** `127.0.0.1`
- **Port:** `5432`
- **Username:** `postgres` (or your application user)
- **Password:** (password for that user)
- **Save password:** ✔️ (check this box)

2. Click **Save**

> **Note:** If PostgreSQL is listening on localhost → connection should work immediately.

---

## Troubleshooting Tips

### pgAdmin Not Accessible

- Check if pgAdmin service is running: `sudo systemctl status pgadmin4`
- Check if NGINX is running: `sudo systemctl status nginx`
- Check if port 5050 is open: `sudo ss -lntp | grep 5050`
- Check NGINX error logs: `sudo tail -f /var/log/nginx/error.log`
- Check pgAdmin logs: `sudo tail -f /var/log/pgadmin/pgadmin4.log`
- Check firewall rules if accessing from remote machine

### Cannot Connect to PostgreSQL

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check PostgreSQL is listening on the correct port: `sudo ss -lntp | grep 5432`
- For remote connections, ensure `postgresql.conf` has `listen_addresses = '*'`
- Ensure `pg_hba.conf` allows connections from pgAdmin host

---

## Summary Checklist

- NGINX installed and configured as reverse proxy
- pgAdmin repository added and package installed
- pgAdmin systemd service created and running
- Database initialized with admin credentials
- NGINX service running and proxying to pgAdmin
- Port 5050 accessible
- PostgreSQL server connection configured