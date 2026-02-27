#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_URL="http://127.0.0.1:4200"
API_URL="http://127.0.0.1:3333"
OLLAMA_URL="http://127.0.0.1:11434"
MODEL_NAME="bubu-ai"
MODELFILE_PATH="${BUBU_MODELFILE:-/Users/nishchay/Desktop/Workspace/ollama-assist/BubuAI.Modelfile}"

NO_OPEN=false
NO_RUN=false

for arg in "$@"; do
  case "$arg" in
    --no-open)
      NO_OPEN=true
      ;;
    --no-run)
      NO_RUN=true
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: npm run setup:dev -- [--no-open] [--no-run]"
      exit 1
      ;;
  esac
done

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
}

check_ollama() {
  if ! command -v ollama >/dev/null 2>&1; then
    echo "Warning: ollama is not installed. Install from https://ollama.com/download"
    return
  fi

  if ! curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
    echo "Ollama not responding. Starting ollama serve..."
    nohup ollama serve >/tmp/bubu-ollama.log 2>&1 &
    sleep 2
  fi

  if [ -f "$MODELFILE_PATH" ]; then
    echo "Using Modelfile: $MODELFILE_PATH"
    echo "Creating/updating model '${MODEL_NAME}' from Modelfile..."
    ollama create "$MODEL_NAME" -f "$MODELFILE_PATH"
    echo "Model '${MODEL_NAME}' is ready from Modelfile."
  elif ollama list 2>/dev/null | awk '{print $1}' | grep -q "^${MODEL_NAME}\(:.*\)\?$"; then
    echo "Ollama model '${MODEL_NAME}' is available."
  else
    echo "Modelfile not found at: $MODELFILE_PATH"
    echo "Pulling Ollama model '${MODEL_NAME}'..."
    ollama pull "$MODEL_NAME"
  fi
}

ensure_node_deps() {
  cd "$ROOT_DIR"

  if [ ! -d node_modules ]; then
    echo "node_modules not found. Installing dependencies..."
    npm install
    return
  fi

  if npm ls --depth=0 >/dev/null 2>&1; then
    echo "Node dependencies are already installed."
  else
    echo "Dependencies out of sync. Re-installing..."
    npm install
  fi
}

free_port_if_used() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Releasing port $port"
    echo "$pids" | xargs -n1 kill -9 2>/dev/null || true
  fi
}

open_browser() {
  if [ "$NO_OPEN" = true ]; then
    echo "Skipping browser open (--no-open)."
    return
  fi

  if command -v open >/dev/null 2>&1; then
    open "$WEB_URL"
  else
    echo "Open this URL manually: $WEB_URL"
  fi
}

main() {
  require_cmd node
  require_cmd npm
  require_cmd curl
  require_cmd lsof

  echo "Project: $ROOT_DIR"
  ensure_node_deps
  check_ollama

  if [ "$NO_RUN" = true ]; then
    echo "Setup complete. Skipping run (--no-run)."
    exit 0
  fi

  free_port_if_used 4200
  free_port_if_used 3333

  echo "Starting app..."
  cd "$ROOT_DIR"
  npm run dev &
  local dev_pid=$!

  # Give dev servers a moment to boot before opening browser.
  sleep 4
  open_browser

  echo "Web: $WEB_URL"
  echo "API: $API_URL"

  wait "$dev_pid"
}

main "$@"
