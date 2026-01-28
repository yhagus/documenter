# PostgreSQL Installation Guide

**Custom Data Directory:** `/data-storage/postgresql`  
**OS:** Ubuntu/Debian  
**PostgreSQL Version:** 16 (adjust based on your version)

---

## 0. Prepare Mount and Data Folder

### Check Mount

```bash
mount | grep /data-storage
df -h /data-storage
```

### Create Directory for PostgreSQL

```bash
sudo mkdir -p /data-storage/postgresql
sudo chown -R postgres:postgres /data-storage/postgresql
sudo chmod 700 /data-storage/postgresql
```

---

## 1. Install PostgreSQL

```bash
sudo apt update
sudo apt -y install postgresql postgresql-contrib
```

### Check Installed Version

```bash
psql --version
```

---

## 2. View Default Cluster Created by Ubuntu

Ubuntu typically auto-creates a `main` cluster in `/var/lib/postgresql/...`

```bash
sudo pg_lsclusters
```

**Example output:**

```
Ver Cluster Port Status Owner    Data directory              Log file
16  main    5432 online postgres /var/lib/postgresql/16/main /var/log/postgresql/postgresql-16-main.log
```

---

## 3. Stop PostgreSQL (Safe Before Modifying Cluster)

```bash
sudo systemctl stop postgresql
```

### Verify Status

```bash
sudo systemctl status postgresql --no-pager
```

---

## 4. Remove Default Main Cluster (We'll Use New Data Directory)

This will remove the newly created default cluster (usually still empty).

```bash
sudo pg_dropcluster --stop 16 main
```

### Verify Cluster is Removed

```bash
sudo pg_lsclusters
```

---

## 5. Create New Cluster with Data Directory `/data-storage/postgresql`

Create the `main` cluster again with the new data location:

```bash
sudo pg_createcluster 16 main -d /data-storage/postgresql
```

### Verify

```bash
sudo pg_lsclusters
```

The **Data directory** should now point to:

```
/data-storage/postgresql
```

---

## 6. Start PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Check Cluster Status

```bash
sudo pg_lsclusters
```

---

## 7. Test Local Connection

### Login as PostgreSQL User

```bash
sudo -u postgres psql
```

### Inside psql Prompt, Check Data Directory Location

```sql
SHOW data_directory;
SHOW hba_file;
SHOW config_file;
\q
```

> **Note:** `data_directory` must show `/data-storage/postgresql`.

---

## 8. (Optional) Configure Listen Address for External Access

By default, PostgreSQL only listens on localhost. To enable network access:

### a) Edit postgresql.conf

Find the config file location (or check from `SHOW config_file;`):

```bash
sudo -u postgres psql -tAc "SHOW config_file;"
```

Edit the file, for example:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

**Change:**

```ini
listen_addresses = '*'
```

### b) Edit pg_hba.conf

Check the location:

```bash
sudo -u postgres psql -tAc "SHOW hba_file;"
```

Edit, for example:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

**Add rules** (example for private networks only; adjust as needed):

```
host    all     all     10.0.0.0/8        scram-sha-256
host    all     all     172.16.0.0/12     scram-sha-256
host    all     all     192.168.0.0/16    scram-sha-256
```

### Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### Check Listening Port

```bash
sudo ss -lntp | grep 5432
```

---

## 9. (Optional but Important) Create Application User & Database

```bash
sudo -u postgres psql
```

### Inside psql:

```sql
CREATE USER appuser WITH PASSWORD 'CHANGE_TO_STRONG_PASSWORD';
CREATE DATABASE appdb OWNER appuser;
\q
```

---

## Summary Checklist

- Data directory set to `/data-storage/postgresql`
- PostgreSQL cluster created and running
- Network access configured (if needed)
- Application user and database created
- Service auto-start enabled
