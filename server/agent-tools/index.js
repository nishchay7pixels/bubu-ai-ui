const path = require('path');
const { tool: searchFilesTool } = require('./search-files');
const { tool: readFileTool } = require('./read-file');
const { tool: writeFileTool } = require('./write-file');

const tools = [searchFilesTool, readFileTool, writeFileTool];
const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

function getWorkspaceRoot() {
  return path.resolve(__dirname, '..', '..');
}

function getToolCatalog() {
  return tools.map((tool) => ({
    name: tool.name,
    purpose: tool.purpose,
    input_schema: tool.inputSchema
  }));
}

async function runTool(name, input = {}) {
  const tool = toolsByName.get(name);

  if (!tool) {
    const error = new Error(`Unknown tool: ${name}`);
    error.status = 404;
    throw error;
  }

  return tool.execute(input, {
    workspaceRoot: getWorkspaceRoot()
  });
}

module.exports = {
  getToolCatalog,
  runTool
};
