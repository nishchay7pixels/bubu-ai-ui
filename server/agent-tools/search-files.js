const fs = require('fs/promises');
const path = require('path');

const DEFAULT_GLOB = '**/*';
const DEFAULT_MAX_RESULTS = 20;
const DEFAULT_MAX_FILE_SIZE_BYTES = 2_000_000;
const MAX_RESULTS_LIMIT = 200;
const MAX_FILE_SIZE_LIMIT = 10_000_000;

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.angular']);

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search string (plain text)' },
    glob: { type: 'string', description: 'Optional glob like **/*.ts', default: '**/*' },
    max_results: { type: 'integer', default: 20 },
    max_file_size_bytes: { type: 'integer', default: 2000000 }
  },
  required: ['query']
};

function clampInt(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function escapeRegex(text) {
  return text.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(globPattern) {
  const normalized = toPosixPath(globPattern || DEFAULT_GLOB);
  const parts = normalized.split('/').map((part) => {
    if (part === '**') {
      return '.*';
    }
    const escaped = escapeRegex(part);
    return escaped.replace(/\\\*/g, '[^/]*').replace(/\\\?/g, '[^/]');
  });
  return new RegExp(`^${parts.join('/')}$`);
}

function pushResult(state, result, maxResults) {
  state.results.push(result);
  if (state.results.length >= maxResults) {
    state.truncated = true;
    return true;
  }
  return false;
}

async function searchFilesInDirectory(directory, state, options) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (state.results.length >= options.maxResults) {
      state.truncated = true;
      return;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      await searchFilesInDirectory(absolutePath, state, options);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = toPosixPath(path.relative(options.workspaceRoot, absolutePath));
    if (!options.globRegex.test(relativePath)) {
      continue;
    }

    if (relativePath.toLowerCase().includes(options.queryLower)) {
      const shouldStop = pushResult(
        state,
        {
          path: relativePath,
          line: 1,
          snippet: '[path match]'
        },
        options.maxResults
      );
      if (shouldStop) {
        return;
      }
    }

    const stats = await fs.stat(absolutePath);
    if (stats.size > options.maxFileSizeBytes) {
      continue;
    }

    const content = await fs.readFile(absolutePath, 'utf8');
    if (content.includes('\u0000')) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.toLowerCase().includes(options.queryLower)) {
        continue;
      }

      const shouldStop = pushResult(
        state,
        {
          path: relativePath,
          line: index + 1,
          snippet: line.trim().slice(0, 500)
        },
        options.maxResults
      );
      if (shouldStop) {
        return;
      }
    }
  }
}

async function execute(input, context) {
  const workspaceRoot = context.workspaceRoot;
  const query = String(input?.query || '').trim();

  if (!query) {
    const error = new Error('query is required');
    error.status = 400;
    throw error;
  }

  const glob = String(input?.glob || DEFAULT_GLOB).trim() || DEFAULT_GLOB;
  const maxResults = clampInt(input?.max_results, DEFAULT_MAX_RESULTS, 1, MAX_RESULTS_LIMIT);
  const maxFileSizeBytes = clampInt(input?.max_file_size_bytes, DEFAULT_MAX_FILE_SIZE_BYTES, 1024, MAX_FILE_SIZE_LIMIT);

  const state = {
    results: [],
    truncated: false
  };

  await searchFilesInDirectory(workspaceRoot, state, {
    workspaceRoot,
    queryLower: query.toLowerCase(),
    globRegex: globToRegex(glob),
    maxResults,
    maxFileSizeBytes
  });

  return {
    ok: true,
    data: {
      query,
      results: state.results,
      truncated: state.truncated
    }
  };
}

module.exports = {
  tool: {
    name: 'search_files',
    purpose: 'Search text in files under workspace with size and result limits.',
    inputSchema: INPUT_SCHEMA,
    execute
  }
};
