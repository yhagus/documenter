# How to Add a User to Sudoers Without a Password Prompt (Ubuntu / Debian)

This guide covers how to grant a Linux user passwordless `sudo` access by
adding them to the sudoers configuration on **Ubuntu** and **Debian**-based
systems.

---

## Compatibility

| Distribution | Supported Versions | Notes |
|---|---|---|
| **Ubuntu** | 12.04 LTS and later | `sudo` is pre-installed; `/etc/sudoers.d/` is enabled out of the box |
| **Debian** | 7 (Wheezy) and later | `sudo` is **not** installed by default — see [Prerequisites](#prerequisites) |

The `/etc/sudoers.d/` drop-in directory became the standard approach starting
with **Debian sudo package version 1.7.2p1-1**. This version shipped with
Debian 7 (Wheezy, 2013) and Ubuntu 12.04 LTS (Precise Pangolin, 2012). Any
release from those versions onward fully supports this method.

> **Note:** The `#includedir /etc/sudoers.d` line in `/etc/sudoers` uses a `#`
> that is **not** a comment — it is the actual include directive syntax used by
> sudo. Do not remove it.

---

## Prerequisites

### Ubuntu

`sudo` comes pre-installed. No extra steps are needed before continuing.

### Debian

`sudo` is not installed by default on a minimal Debian install. Install it
first by logging in as root:

```bash
su -
apt update && apt install sudo
```

After installing, log out and back in before proceeding.

---

## Method 1 — Drop-in File in `/etc/sudoers.d/` (Recommended)

This is the preferred and safest approach. Instead of editing the main
`/etc/sudoers` file directly, you place a separate configuration file inside
the `/etc/sudoers.d/` directory. This keeps changes isolated and survives
package upgrades without conflict.

### Step 1 — Create the sudoers drop-in file

Run the following command as root (or with `sudo`):

```bash
echo "bagus ALL=(ALL:ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/bagus
```

This creates a file named `bagus` inside `/etc/sudoers.d/` with the rule
granting passwordless sudo access to the user `bagus`.

### Step 2 — Set the correct file permissions

The file must be readable only by root (mode `0440`):

```bash
sudo chmod 0440 /etc/sudoers.d/bagus
```

### Step 3 — Verify the syntax

Run a syntax check on the entire sudoers configuration to make sure nothing
is broken:

```bash
sudo visudo -c
```

A successful output will look like:

```
/etc/sudoers: syntax ok
/etc/sudoers.d/bagus: syntax ok
```

### Step 4 — Confirm the file content

```bash
sudo cat /etc/sudoers.d/bagus
```

Expected output:

```
bagus ALL=(ALL:ALL) NOPASSWD: ALL
```

---

## Method 2 — Edit `/etc/sudoers` Directly via `visudo`

This method works but is less recommended than Method 1, because changes made
directly to `/etc/sudoers` can be overwritten during package upgrades.

### Step 1 — Open the sudoers file with visudo

```bash
sudo visudo
```

### Step 2 — Add the rule

Scroll to the bottom of the file (or find the user privilege specification
section) and add the following line:

```
bagus ALL=(ALL:ALL) NOPASSWD: ALL
```

### Step 3 — Save and exit

`visudo` will automatically check for syntax errors before saving. If there
is an error, it will warn you and let you fix it before writing the file.

---

## Testing

Log in as `bagus` (or open a new terminal session) and run a command that
requires elevated privileges:

```bash
sudo whoami
```

If everything is configured correctly, the command will return `root`
**without** asking for a password.

You can also list the effective sudo privileges for the user:

```bash
sudo -l
```

The output will confirm the `NOPASSWD` rule is active.

---

## Restricting Access to Specific Commands

Granting `NOPASSWD: ALL` gives the user full unrestricted sudo access. If you
only want to allow certain commands without a password, replace `ALL` at the
end with the absolute paths to the specific commands, separated by commas:

```
bagus ALL=(ALL:ALL) NOPASSWD: /usr/bin/docker, /usr/bin/systemctl
```

In this example, `bagus` can run `docker` and `systemctl` without a password,
but all other `sudo` commands will still require authentication.

---

## Revoking Access

To remove passwordless sudo for `bagus`, simply delete the drop-in file:

```bash
sudo rm /etc/sudoers.d/bagus
```

If you used Method 2, open `visudo` again and delete the line you added.

---

## Quick Reference

| Action | Command |
|---|---|
| Add passwordless sudo (drop-in file) | `echo "bagus ALL=(ALL:ALL) NOPASSWD: ALL" \| sudo tee /etc/sudoers.d/bagus` |
| Set correct permissions | `sudo chmod 0440 /etc/sudoers.d/bagus` |
| Validate syntax | `sudo visudo -c` |
| Test the configuration | `sudo whoami` (as `bagus`) |
| List effective privileges | `sudo -l` |
| Revoke access | `sudo rm /etc/sudoers.d/bagus` |