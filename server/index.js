const express = require('express');
const cors = require('cors');
const { getToolCatalog, runTool } = require('./agent-tools');

const app = express();
const port = 3333;

const EMOTIONS = ['neutral', 'joyful', 'empathetic', 'curious', 'worried', 'frustrated'];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function detectEmotion(text) {
  const normalized = String(text || '').toLowerCase();

  if (includesAny(normalized, ['angry', 'annoyed', 'frustrated', 'hate', 'ridiculous', 'wtf', 'damn'])) {
    return 'frustrated';
  }

  if (includesAny(normalized, ['sorry', 'i understand', 'i hear you', 'that sounds hard', 'you are not alone'])) {
    return 'empathetic';
  }

  if (includesAny(normalized, ['sad', 'upset', 'worried', 'concern', 'anxious', 'afraid', 'careful'])) {
    return 'worried';
  }

  if (
    normalized.includes('!') ||
    includesAny(normalized, ['great', 'awesome', 'amazing', 'happy', 'glad', 'excited', 'love', 'fantastic', 'excellent'])
  ) {
    return 'joyful';
  }

  if (normalized.includes('?') || includesAny(normalized, ['let us explore', 'why', 'how', 'what if', 'could', 'maybe'])) {
    return 'curious';
  }

  return 'neutral';
}

function buildVerbosityInstruction(verbosity) {
  if (verbosity === 'concise') {
    return 'Keep answers concise and direct by default.';
  }
  if (verbosity === 'detailed') {
    return 'Provide deeper explanations and richer detail when useful.';
  }
  return 'Use balanced answer length by default.';
}

app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    res.json({ ok: response.ok });
  } catch {
    res.status(503).json({ ok: false, error: 'Ollama is unavailable.' });
  }
});

app.get('/api/tools', (req, res) => {
  return res.json({ ok: true, data: getToolCatalog() });
});

app.post('/api/tools/:name', async (req, res) => {
  try {
    const result = await runTool(req.params.name, req.body ?? {});
    return res.json(result);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      ok: false,
      error: error?.message || 'Tool execution failed.'
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [], config = {} } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const model = config.model || 'bubu-ai';
  const ollamaBaseUrl = config.ollamaBaseUrl || 'http://127.0.0.1:11434';
  const temperature = Number.isFinite(config.temperature) ? config.temperature : 0.7;
  const maxHistoryMessages = Number.isFinite(config.maxHistoryMessages)
    ? Math.max(2, Math.min(30, Math.round(config.maxHistoryMessages)))
    : 12;

  const activeSkills = Array.isArray(config.skills) ? config.skills.filter((x) => x.active) : [];
  const activeTools = Array.isArray(config.tools) ? config.tools.filter((x) => x.active) : [];

  const skillText = activeSkills.map((skill) => `- ${skill.name}: ${skill.instructions}`).join('\n');
  const toolText = activeTools.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n');

  const identityLine = `Agent name: ${config.displayName || 'Bubu'}. ${config.shortBio || ''}`.trim();
  const styleLine = `Response style: ${config.responseStyle || 'Friendly and practical.'}`;
  const verbosityLine = buildVerbosityInstruction(config.verbosity);

  const systemPrompt = [
    config.persona ||
      'You are Bubu, an emotionally expressive robot assistant. You can be warm, playful, and practical.',
    identityLine,
    styleLine,
    verbosityLine,
    skillText ? `Active skills:\n${skillText}` : '',
    toolText ? `Available tools:\n${toolText}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const payload = {
    model,
    stream: false,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((entry) => entry?.role === 'user' || entry?.role === 'assistant')
        .slice(-maxHistoryMessages)
        .map((entry) => ({ role: entry.role, content: entry.content })),
      { role: 'user', content: message }
    ],
    options: { temperature }
  };

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data?.error || `Ollama error ${response.status}`
      });
    }

    const reply = data?.message?.content || 'No reply from model.';
    const emotion = detectEmotion(reply);

    return res.json({
      reply,
      emotion: EMOTIONS.includes(emotion) ? emotion : 'neutral'
    });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to call Ollama (${ollamaBaseUrl}). ${error.message}`
    });
  }
});

app.listen(port, () => {
  console.log(`Ollama bridge listening on http://127.0.0.1:${port}`);
});
