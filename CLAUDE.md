# wopr-plugin-signal

Signal channel plugin for WOPR using signal-cli as a subprocess.

## Commands

```bash
npm run build     # tsc
npm run check     # biome check + tsc --noEmit (run before committing)
npm run lint:fix  # biome check --fix src/
npm run format    # biome format --write src/
npm test          # vitest run
```

## Architecture

```
src/
  index.ts   # Plugin entry — spawns/manages signal-cli process
  client.ts  # signal-cli subprocess wrapper (stdio JSON-RPC)
  daemon.ts  # Daemon mode — keeps signal-cli alive, restarts on crash
  types.ts   # Plugin-local types
```

## Key Details

- **Dependency**: `signal-cli` must be installed on the host (Java-based CLI, not a npm package)
- Communicates via `signal-cli --output=json daemon` over stdio
- Signal number registration is separate from WOPR setup — must be done once manually via signal-cli
- **Gotcha**: signal-cli requires a linked or registered phone number. Plugin will fail to start if signal-cli isn't installed or the number isn't registered.
- No official Signal API — this uses the unofficial signal-cli project

## Plugin Contract

Imports only from `@wopr-network/plugin-types`. Never import from `@wopr-network/wopr` core.

## Issue Tracking

All issues in **Linear** (team: WOPR). Issue descriptions start with `**Repo:** wopr-network/wopr-plugin-signal`.

## Session Memory

At the start of every WOPR session, **read `~/.wopr-memory.md` if it exists.** It contains recent session context: which repos were active, what branches are in flight, and how many uncommitted changes exist. Use it to orient quickly without re-investigating.

The `Stop` hook writes to this file automatically at session end. Only non-main branches are recorded — if everything is on `main`, nothing is written for that repo.