# Contributing

This repository does **not** accept external pull requests or unsolicited
patches.

SpaceXAI develops this software internally. The public tree is published for
source transparency and local builds under the terms of the Apache License,
Version 2.0 (see [`LICENSE`](LICENSE)).

## Security reports

Please report security issues through the process described in
[`SECURITY.md`](SECURITY.md). Do not open a public issue for vulnerabilities.

## Licensing of this source

By downloading or using this source, you agree that your use is governed by
the Apache License, Version 2.0. No contributor license agreement is offered
because external contributions are not accepted.

## Naming and Branding Policy

This repository is a downstream fork of the `grok-build` / `grok-cli` project. To minimize merge conflicts and maintain ease of merging future upstream updates, we enforce the following naming policies:

- **Path and Env Variable Resolution:** Keep all load-bearing directories (e.g. `~/.grok/`, `.grok/`), binary names (`grok`, `grok.exe`), and environment variables (e.g. `GROK_HOME`, `GROK_API_KEY`) named matching their upstream defaults. Do not introduce custom `.intelekt/` paths or `INTELEKT_HOME` variables into configuration resolution or file path loading logic in the code.
- **UI Branding:** Restrict branding and product name changes (e.g., "Intelekt") strictly to user-facing UI / display strings and client/server CLI output strings.

## Keeping Up-to-Date with Upstream

We regularly pull in updates, security patches, and features from the upstream [xai-org/grok-build](https://github.com/xai-org/grok-build) repository.

To merge upstream updates into this fork, follow this fetch/merge/conflict-resolution cycle:

### 1. Configure the Upstream Remote
If you haven't already, add the upstream repository as a git remote:
```bash
git remote add upstream https://github.com/xai-org/grok-build.git
```

### 2. Fetch and Merge on a Regular Cadence
On a weekly cadence or when security advisories are published upstream, fetch the latest branches:
```bash
# Fetch upstream updates
git fetch upstream

# Switch to our main integration branch
git checkout main

# Merge upstream/main into our main
git merge upstream/main
```

### 3. Conflict Resolution Policy
During the merge, conflicts may occur in rebranded display areas or custom integrations. When resolving conflicts, observe the following rules:
- **Preserve the Sandbox & Hook Enhancements:** Keep the custom security profiles (like the `hosted` profile in `xai-grok-sandbox`), the `dontAsk` headless permission resolution logic in `xai-grok-workspace`, and the shell intercepts in `xai-grok-hooks`.
- **Maintain Configuration Defaults:** Ensure the pre-populated default custom model configurations (e.g., `insforge-gateway` mapping to the session-injected `INSFORGE_GATEWAY_KEY`) are not overwritten by upstream SpaceXAI-hosted defaults.
- **Adopt Upstream Performance & Security Upgrades:** Always prefer upstream code changes for common utilities, HTTP clients, and OTLP telemetry collectors unless they directly conflict with our custom hooks or BaaS endpoint integrations.

### 4. Post-Merge Validation
After resolving conflicts and completing the merge:
- Recompile the workspace to verify there are no compilation errors.
- Run the full test suite to ensure no regressions were introduced.
