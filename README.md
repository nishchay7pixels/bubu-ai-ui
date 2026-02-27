# Bubu AI UI

An Angular-based emotional robot chat interface running locally, backed by a local Ollama model (`bubu-ai`).

Bubu includes:
- expressive animated face with multiple moods/expressions
- command-driven expression overrides (e.g. `/sleep`, `/laugh`, `/cry`)
- `/console` tab for deep runtime/personality/behavior configuration
- local Node API bridge to Ollama

---

## 1) Project Overview

This project is a local-first AI companion UI that combines:
- **Frontend**: Angular app (`src/`)
- **Backend**: Express API bridge (`server/index.js`)
- **Model Runtime**: Ollama running locally with model `bubu-ai`

Primary routes:
- `/` chat + animated face
- `/console` full configuration console for Bubu

---

## 2) Features

### Chat + Face Engine
- Real-time chat with local LLM via Ollama
- Mood/expression engine with states inspired by your reference face set
- Typing gaze (eyes look down while typing)
- Forehead hover reaction (shy/happy)
- Idle sleep mode after configurable timeout

### Command Mode (in chat)
You can control face behavior by typing commands directly:
- `/sleep`, `/wake`, `/auto`
- `/laugh`, `/cry`, `/happy`, `/calm`
- `/curious`, `/inquiry`, `/scan`, `/ponder`, `/concentrate`
- `/amazed`, `/bored`, `/wonder`, `/notice`
- `/skeptical`, `/suspicious`, `/irate`, `/shy`

Aliases are supported (e.g. `lol`, `giggle`, `sad`, `sus`, `focus`, etc.).

### Console Config (OpenClaw-style control surface)
You can configure:
- Identity: display name, bio, persona, style, verbosity
- Runtime: model, Ollama URL, temperature, history window
- Behavior: command mode, auto emotion, typing gaze, forehead reaction, idle timeout
- Skills/tools: add/remove/toggle active

---

## 3) Tech Stack

- Angular 16
- Express 5
- Ollama local runtime
- Material Symbols Rounded icon font

---

## 4) Prerequisites

Install locally:
- Node.js + npm
- Ollama

Ollama download:
- <https://ollama.com/download>

### Required Modelfile source of truth
This project expects your model definition file at:

`/Users/nishchay/Desktop/Workspace/ollama-assist/BubuAI.Modelfile`

Current expected content (as provided):
- `FROM qwen2.5:7b-instruct`
- custom system prompt/tone/behavior
- parameters (`temperature`, `top_p`, `repeat_penalty`, `num_ctx`, `num_predict`)

If your Modelfile is elsewhere, set env var before running setup:

```bash
export BUBU_MODELFILE="/absolute/path/to/BubuAI.Modelfile"
```

---

## 5) Quick Start (Recommended)

From project root:

```bash
npm run setup:dev
```

This script automatically:
1. checks required commands (`node`, `npm`, `curl`, `lsof`)
2. installs npm dependencies if missing/out-of-sync
3. checks Ollama health
4. **creates/updates `bubu-ai` from `BubuAI.Modelfile`**
5. falls back to `ollama pull bubu-ai` if Modelfile is missing
6. frees ports `4200` and `3333` if occupied
7. starts API + frontend
8. opens browser at `http://127.0.0.1:4200`

Dry check (no run / no open):

```bash
npm run setup:check
```

---

## 6) Manual Run

```bash
npm install
npm run dev
```

App URLs:
- Web: `http://127.0.0.1:4200`
- Console: `http://127.0.0.1:4200/console`
- API: `http://127.0.0.1:3333`
- Health: `http://127.0.0.1:3333/api/health`

---

## 7) Build / Validate

```bash
npm run build
```

Note: there is currently a non-blocking Angular warning for `anyComponentStyle` budget due to rich face CSS.

---

## 8) Project Structure

```text
bubu-ai-ui/
  server/
    index.js                  # Express bridge to Ollama
  scripts/
    bootstrap-dev.sh          # auto setup/run helper
  src/
    app/
      chat/
        chat.component.ts     # chat flow + expression engine + commands
        chat.component.html
        chat.component.css
      console/
        console.component.ts  # config management logic
        console.component.html
        console.component.css
      app-state.service.ts    # localStorage config/history
      chat.service.ts         # frontend API client
      models.ts               # shared interfaces/config model
  README.md
```

---

## 9) Configuration Model (Saved in Browser LocalStorage)

Key config fields:
- `model`
- `ollamaBaseUrl`
- `temperature`
- `persona`
- `displayName`
- `shortBio`
- `responseStyle`
- `verbosity` (`concise|balanced|detailed`)
- `maxHistoryMessages`
- `idleTimeoutSeconds`
- `enableCommandMode`
- `enableTypingGaze`
- `enableForeheadReaction`
- `enableAutoEmotion`
- `skills[]`
- `tools[]`

Data persistence:
- config and chat history are stored in browser localStorage
- clearing browser storage resets config/history

---

## 10) How Prompting Works

`server/index.js` builds a system prompt from console settings:
- base persona
- identity (`displayName`, `shortBio`)
- response style + verbosity hint
- active skills
- active tools

Chat history sent to model is limited by `maxHistoryMessages`.

---

## 11) Integrations (Calendar, etc.)

Current tools in console are prompt-level descriptors.
To connect real services (Google Calendar, Notion, etc.), implement server-side tool endpoints in `server/index.js` and route chat intents to those endpoints.

Typical pattern:
1. add OAuth/token management in backend
2. add tool endpoints (`/api/tools/...`)
3. add console integration settings (connect/status)
4. execute tools from chat workflow

---

## 12) Troubleshooting

### App not opening
Run:
```bash
npm run setup:dev
```

### Port already in use
`setup:dev` auto-releases `4200` and `3333`.

### Ollama unavailable
Check:
```bash
curl http://127.0.0.1:11434/api/tags
```

If needed:
```bash
ollama serve
```

### Modelfile not found
By default setup looks for:
`/Users/nishchay/Desktop/Workspace/ollama-assist/BubuAI.Modelfile`

Override path:
```bash
export BUBU_MODELFILE="/absolute/path/to/BubuAI.Modelfile"
npm run setup:dev
```

### Model errors from chat
Verify console model name matches built model (`bubu-ai`) and that `ollama create bubu-ai -f <Modelfile>` succeeds.

### npm/node warning
You may see an npm warning about Node version support. The project can still run; for best compatibility, use an LTS Node version supported by your npm/Angular toolchain.

---

## 13) Developer Notes

Useful scripts:
- `npm run setup:dev` automated setup/run/open
- `npm run setup:check` dry validation
- `npm run dev` start API + frontend
- `npm run build` production build

---

## 14) License

Use internally or adapt as needed. Add a formal license file if you plan external distribution.
