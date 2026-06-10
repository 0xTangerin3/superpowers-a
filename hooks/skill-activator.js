#!/usr/bin/env node

const { classifyPrompt } = require('./planning-depth-gate');

function hookContext(result) {
  const route = {
    depth: result.depth,
    mode: result.mode,
    scores: result.scores,
    forcedReasons: result.forcedReasons,
    suggestedSkills: result.suggestedSkills,
    approvalRequired: result.approvalRequired,
  };

  const json = JSON.stringify(route);
  let guidance;
  if (result.depth === 1) {
    guidance = 'Act directly; verify only the requested outcome.';
  } else if (result.depth === 2) {
    guidance = 'Use a short checklist and focused tests or equivalent verification.';
  } else if (result.depth === 3) {
    guidance = 'Use structured planning, appropriate workflow skills, and verification before completion.';
  } else {
    guidance = 'Approval required: state the concrete risk and wait for explicit approval before the risky action.';
  }

  return `<superpower-a-routing>\n${json}\n${guidance}\n</superpower-a-routing>`;
}

function buildHookResponse(input = {}) {
  const result = classifyPrompt(input.prompt || '', { mode: input.mode });

  if (result.depth === 0) {
    return {};
  }

  return {
    additionalContext: hookContext(result),
  };
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  try {
    const raw = await readStdin();
    const input = raw.trim() ? JSON.parse(raw) : {};
    process.stdout.write(JSON.stringify(buildHookResponse(input)));
  } catch {
    process.stdout.write('{}');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildHookResponse,
  hookContext,
};
