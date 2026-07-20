# 26. Intelekt Agent Skill Specifications

This document defines the specific programming conventions, database patterns, and SDK styles that the Intelekt coding agent (running in Intelekt-CLI headless mode) must follow when creating or modifying applications. 

By layering these specifications on top of default Grok Build behaviors, we ensure consistent, secure, and predictable application generation.

---

## 1. Core Principles

* **No Placeholders:** Never generate files containing TODOs, fake code, or unimplemented mocks. All generated paths must be fully functional.
* **Strict Type Safety:** All code must be written in TypeScript, strictly adhering to Next.js App Router conventions. Avoid `any` declarations; enforce well-typed models and interfaces.
* **No Direct Credentials:** Hardcoding API keys or token strings is strictly prohibited. Use standard environment variables (`NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`) or config overrides.

---

## 2. InsForge SDK Integration Patterns

All database, authorization, file storage, and AI interactions must use the `@insforge/sdk` client, imported from the pre-wired client helper `@/lib/insforge`.

### A. Database (CRUD) Conventions
* **Array-Based Inserts:** Database inserts always accept an array of rows:
  ```typescript
  // CORRECT:
  await insforge.database.from("tasks").insert([{ title: "Buy groceries", status: "pending" }]);

  // INCORRECT (will error):
  await insforge.database.from("tasks").insert({ title: "Buy groceries" });
  ```
* **Row-Level Security (RLS) Alignment:** When writing queries that target user-specific records, ensure filters include `user_id` corresponding to the user's active session.

### B. Authentication Conventions
* **Session Verification:** Use `insforge.auth.getCurrentUser()` on client components and standard cookie-based JWT lookups on the server.
* **Database References:** In database schemas, foreign keys mapping to users must reference the `auth.users(id)` identity schema.

### C. Storage Conventions
* **Dual-Property Persistence:** When files are uploaded to InsForge Storage, the agent must persist **both** properties returned by the upload promise: the `key` (path) and the direct `url`:
  ```typescript
  const { data, error } = await insforge.storage.from("receipts").upload("path/file.jpg", file);
  // Persist data.key AND data.url in the database
  ```
* **Bucket Access:** Do not assume a bucket is public. Public bucket operations use `.getPublicUrl()`; authenticated/private bucket operations require short-lived read tokens.

### D. Model Gateway (AI) Conventions
* Custom model choices are managed globally by modifying `~/.grok/config.toml` to map to the InsForge Model Gateway endpoint.
* In application code, execute text or structured generation using `insforge.ai.generateText` with the correct model string (e.g., `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`):
  ```typescript
  const { data, error } = await insforge.ai.generateText({
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: "..." }]
  });
  ```

---

## 3. Project Structure Conventions (Intelekt Apps)

Intelekt-generated applications must align with the following directory structure:

```
├── .insforge/
│   └── project.json          # Linked project metadata (OSS host & ID)
├── src/
│   ├── app/                  # Next.js App Router (pages & API routes)
│   ├── components/           # UI elements (using Shadcn, Tailwind, Lucide)
│   └── lib/
│       ├── insforge.ts       # Configured `@insforge/sdk` client instance
│       └── insforge-actions.ts # CRUD wrappers for auth, DB, storage, and AI
├── package.json
└── tsconfig.json
```

---

## 4. Intelekt-automations Integration (Task Queues)

> [!NOTE]
> **Automation Integration (Work-in-Progress):**
> When Intelekt-automations' custom action package lands, this section will define the SDK syntax for task queuing and trigger event subscription.
> 
> For now, the agent should configure an integration placeholder in `src/lib/insforge-actions.ts` ready to attach to the Trigger.dev client, pointing to the self-hosted custom compute URL:
> `https://automations-web-[projectId].fly.dev`
