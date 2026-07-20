# Intelekt Hosted Profile

This guide documents the **Intelekt Hosted Profile**, a shipped default configuration tailored for hosted, unattended, multi-tenant environments where safety, sandboxing, and non-blocking headless execution are paramount.

---

## Overview

The default configuration of Intelekt-CLI upstream is optimized for interactive local use (interactive prompt modes, sandbox off). In a hosted, unattended multi-tenant SaaS environment, interactive prompting would hang indefinitely, and open execution poses security risks.

The **Intelekt Hosted Profile** modifies these defaults to establish a secure, fail-closed, unattended baseline by combining three main security tiers:
1. **Hosted Sandbox Profile** (OS-level filesystem sandboxing)
2. **"dontAsk" Permission Mode** (automatic headless rejection)
3. **PreToolUse Safety Hook** (restricting terminal commands to a narrow allowlist of development tools)

---

## 1. Sandbox configuration

The default sandbox profile is set to `hosted` (based on the `devbox` sandbox profile). 

### Scope
- File access is scoped strictly to the active project's container root (`/`).
- Network access is permitted for developer package management (e.g., Cargo, npm, pnpm) but filesystem writes are restricted to safe boundaries.

### Credential Deny List
The `hosted` profile enforces a kernel-level (read-deny) glob matching pattern targeting sensitive workspace files:
- `**/.env` (Environment variables and secrets)
- `**/*.pem` (Private keys)
- `**/id_rsa`, `**/id_dsa`, `**/id_ecdsa`, `**/id_ed25519` (SSH keys)
- `**/*.key` (Cryptographic key files)
- `**/credentials`, `**/.git-credentials` (System and provider credentials)
- `**/*.pkcs12`, `**/*.pfx`, `**/*.p12` (Certificate containers)

Any attempt to read these paths results in a fail-closed filesystem error.

---

## 2. Headless Permissions & "dontAsk"

To prevent headless container processes from hanging when a tool requires approval:
- The shipped default `defaultMode` is set to `"dontAsk"`.
- This maps to `PromptPolicy::Deny`.
- Interactive prompts are disabled: if a tool call has not been pre-approved by configuration rules, it is immediately denied.
- This default is enforced as a **Managed Setting** (shipped inside `ManagedSettings` baseline), meaning it is **non-bypassable and not user-editable per project**. Project-level configuration files cannot override or loosen the prompt policy.

---

## 3. PreToolUse Safety Hook

Because certain dangerous commands (like destructive git pushes or directory removals) might otherwise cause prompts or lead to unintended damage, a hardcoded **PreToolUse safety hook** is evaluated before the permission system checks are run.

### Allowed Commands
Only the following development commands and basic utility commands are permitted to run in a bash tool call:
- **Common Dev Tools:** `git`, `npm`, `pnpm`, `cargo`, `vite`
- **Read-Only / Basic Utilities:** `ls`, `cat`, `pwd`, `date`, `whoami`, `hostname`, `uptime`, `ps`, `head`, `tail`, `wc`, `sort`, `uniq`, `tr`, `cut`, `grep`, `rg`, `cd`

Any command that does not match this narrow allowlist is blocked and denied by the hook.

### Explicitly Denied Destructive Commands
Even within allowed commands, destructive operations are explicitly denied:
- **rm -rf:** Any `rm` invocation containing recursive (`-r`, `-R`, `--recursive`) and force (`-f`, `--force`) flags is blocked.
- **git push --force:** Any `git push` invocation containing force flags (`--force`, `-f`, `--force-with-lease`) is blocked.
- **Shell Bypasses:** Command substitutions (`$()` or backticks `` ` ``) are completely blocked.

---

## Auditability

The hosted profile features are implemented natively in Rust within the `intelekt-sandbox`, `intelekt-workspace`, and `intelekt-hooks` crates to guarantee high performance, security, and immunity to project-level overrides.
