const fs = require('fs/promises');
const path = require('path');

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'Relative path within workspace' },
    content: { type: 'string', description: 'Full file content to write' },
    mode: { type: 'string', enum: ['overwrite', 'append'], default: 'overwrite' },
    create_dirs: { type: 'boolean', default: true }
  },
  required: ['path', 'content']
};

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

  if (typeof input?.content !== 'string') {
    const error = new Error('content must be a string');
    error.status = 400;
    throw error;
  }

  const mode = input?.mode === 'append' ? 'append' : 'overwrite';
  const createDirs = input?.create_dirs !== false;

  const absolutePath = path.resolve(workspaceRoot, relativePath);
  if (!absolutePath.startsWith(workspaceRoot + path.sep) && absolutePath !== workspaceRoot) {
    const error = new Error('path must stay within workspace');
    error.status = 400;
    throw error;
  }

  const parentDir = path.dirname(absolutePath);

  if (createDirs) {
    await fs.mkdir(parentDir, { recursive: true });
  } else {
    try {
      const stat = await fs.stat(parentDir);
      if (!stat.isDirectory()) {
        const error = new Error(`parent path is not a directory: ${toPosixPath(path.relative(workspaceRoot, parentDir))}`);
        error.status = 400;
        throw error;
      }
    } catch {
      const error = new Error(`parent directory does not exist: ${toPosixPath(path.relative(workspaceRoot, parentDir))}`);
      error.status = 400;
      throw error;
    }
  }

  if (mode === 'append') {
    await fs.appendFile(absolutePath, input.content, 'utf8');
  } else {
    await fs.writeFile(absolutePath, input.content, 'utf8');
  }

  const bytesWritten = Buffer.byteLength(input.content, 'utf8');

  return {
    ok: true,
    data: {
      path: toPosixPath(relativePath),
      bytes_written: bytesWritten,
      mode
    }
  };
}

module.exports = {
  tool: {
    name: 'write_file',
    purpose: 'Write or append text content to a file in the workspace.',
    inputSchema: INPUT_SCHEMA,
    execute
  }
};
