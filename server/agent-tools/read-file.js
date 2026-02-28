const fs = require('fs/promises');
const path = require('path');

const DEFAULT_MAX_CHARS = 40_000;
const MAX_CHARS_LIMIT = 500_000;

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'Relative path within workspace' },
    max_chars: { type: 'integer', description: 'Max chars to return (default 40000)' }
  },
  required: ['path']
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

function assertSafeRelativePath(inputPath) {
  const raw = String(inputPath || '').trim();

  if (!raw) {
    const error = new Error('path is required');
    error.status = 400;
    throw error;
  }

  if (path.isAbsolute(raw)) {
    const error = new Error('path must be relative to workspace');
    error.status = 400;
    throw error;
  }

  const normalized = path.normalize(raw);

  if (normalized.startsWith('..') || normalized.includes(`..${path.sep}`)) {
    const error = new Error('path must stay within workspace');
    error.status = 400;
    throw error;
  }

  return normalized;
}

async function execute(input, context) {
  const workspaceRoot = context.workspaceRoot;
  const relativePath = assertSafeRelativePath(input?.path);
  const maxChars = clampInt(input?.max_chars, DEFAULT_MAX_CHARS, 1, MAX_CHARS_LIMIT);

  const absolutePath = path.resolve(workspaceRoot, relativePath);

  if (!absolutePath.startsWith(workspaceRoot + path.sep) && absolutePath !== workspaceRoot) {
    const error = new Error('path must stay within workspace');
    error.status = 400;
    throw error;
  }

  let stats;
  try {
    stats = await fs.stat(absolutePath);
  } catch {
    const error = new Error(`file not found: ${toPosixPath(relativePath)}`);
    error.status = 404;
    throw error;
  }

  if (!stats.isFile()) {
    const error = new Error(`path is not a file: ${toPosixPath(relativePath)}`);
    error.status = 400;
    throw error;
  }

  const content = await fs.readFile(absolutePath, 'utf8');
  if (content.includes('\u0000')) {
    const error = new Error('file appears to be binary and cannot be returned as text');
    error.status = 400;
    throw error;
  }

  const truncated = content.length > maxChars;

  return {
    ok: true,
    data: {
      path: toPosixPath(relativePath),
      content: truncated ? content.slice(0, maxChars) : content,
      truncated
    }
  };
}

module.exports = {
  tool: {
    name: 'read_file',
    purpose: 'Read a text file from the workspace.',
    inputSchema: INPUT_SCHEMA,
    execute
  }
};
