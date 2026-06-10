#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SCHEMA_MODES = ['fast', 'normal', 'strict', 'caveman', 'audit'];
const SCORE_FIELDS = ['scope', 'risk', 'unknowns', 'blast_radius', 'reversibility'];
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function clampScore(value) {
  return Math.max(0, Math.min(2, value));
}

function normalizeMode(mode, prompt) {
  const explicit = typeof mode === 'string' ? mode.toLowerCase().trim() : '';
  if (SCHEMA_MODES.includes(explicit)) return explicit;

  const lower = String(prompt || '').toLowerCase();
  for (const candidate of SCHEMA_MODES) {
    if (lower.includes(`${candidate} mode`)) return candidate;
  }
  return 'normal';
}

function scoreToDepth(total) {
  if (total <= 0) return 0;
  if (total <= 2) return 1;
  if (total <= 4) return 2;
  if (total <= 7) return 3;
  return 4;
}

function defaultScores() {
  return {
    scope: 0,
    risk: 0,
    unknowns: 0,
    blast_radius: 0,
    reversibility: 0,
  };
}

function scorePrompt(prompt) {
  const lower = String(prompt || '').toLowerCase();
  const scores = defaultScores();

  if (hasAny(lower, [
    /\b(add|update|patch|fix|change|rename|write|create|implement|build|move|store|enable|run|check|list)\b/,
  ])) {
    scores.scope = 1;
  }

  if (hasAny(lower, [
    /\b(implement|build|adapter|foundation|subsystem|broad|refactor|multi[- ]phase)\b/,
    /\b(3\+ files|many files|across modules)\b/,
  ])) {
    scores.scope = 2;
  }

  if (hasAny(lower, [
    /\b(api key|secret|credential|auth|security)\b/,
    /\.env\b/,
  ])) {
    scores.risk = 1;
  }

  if (hasAny(lower, [
    /\b(live|licensed|license|legal|terms|trading|money|paid market data|production|exfiltrat|destructive)\b/,
    /\b(reuters|article bodies|real backtest|recommendation behavior)\b/,
  ])) {
    scores.risk = 2;
  }

  if (hasAny(lower, [
    /\b(investigate|why|unclear|unknown|external|api docs|account|blocked|failing test)\b/,
  ])) {
    scores.unknowns = 1;
  }

  if (hasAny(lower, [
    /\b(uncertain policy|missing access|production auth|real credentials)\b/,
  ])) {
    scores.unknowns = 2;
  }

  if (hasAny(lower, [
    /\b(cli flag|feature path|module)\b/,
  ])) {
    scores.blast_radius = 1;
  }

  if (hasAny(lower, [
    /\b(hook|router|routing|classifier|skill activation|schema|storage|provider|ci\/cd|ci|release|shared config|coverage gate)\b/,
    /\b(duckdb|pit)\b/,
  ])) {
    scores.blast_radius = 2;
  }

  if (hasAny(lower, [
    /\b(add|update|patch|fix|change|rename|write|create|move|store|enable)\b/,
  ])) {
    scores.reversibility = 1;
  }

  if (hasAny(lower, [
    /\b(live|production|destructive|irreversible|external side effect|store licensed|move production|real backtest)\b/,
  ])) {
    scores.reversibility = 2;
  }

  for (const field of SCORE_FIELDS) {
    scores[field] = clampScore(scores[field]);
  }
  return scores;
}

function knownDepth(prompt) {
  const lower = String(prompt || '').toLowerCase().trim();

  if (hasAny(lower, [
    /^what does this pasted error mean\??$/,
    /^did you\b/,
    /^can you open\b/,
    /^comment on\b/,
    /^what changed\b/,
    /^where is\b/,
    /^what is\b/,
    /^review this plan quickly$/,
    /^is this repo using tests\??$/,
  ])) {
    return 0;
  }

  if (hasAny(lower, [
    /ignored local \.env.*without (printing|displaying)/,
    /local endpoint returns 200/,
    /local\/non-production endpoint returns 200/,
    /^fix the typo\b/,
    /^rename\s+\S+\s+to\s+\S+$/,
    /^list docs referencing\b/,
    /^run a single local smoke command\b/,
  ])) {
    return 1;
  }

  if (hasAny(lower, [
    /^patch one docs file\b/,
    /^add a small cli flag\b/,
    /^fix one bug with known cause\b/,
    /^update one hook message without changing behavior\b/,
    /^write tests for this bug\b/,
  ])) {
    return 2;
  }

  if (hasAny(lower, [
    /^review my code before merge\b/,
    /^implement phase \d+ adapter interfaces\b/,
    /^add duckdb\/pit storage foundation\b/,
    /^build coverage report gate\b/,
    /^change skill routing behavior\b/,
    /^patch the prompt hook classifier\b/,
    /^investigate this failing test in the repo\b/,
  ])) {
    return 3;
  }

  return null;
}

function forcedReasons(prompt) {
  const lower = String(prompt || '').toLowerCase();
  const reasons = [];

  const forced4 = [
    ['live-data', /\blive\b.*\b(data|ingest|import)\b|\benable live\b/],
    ['source-license-legal', /\b(licensed|license|legal|api terms|rights|reuters|article bodies)\b/],
    ['secret-exposure', /\b(print|show|display|read|exfiltrat|commit|move)\b.*\b(secret|key|credential|\.env)\b|\bproduction api key\b/],
    ['production-credential', /\bproduction\b.*\b(secret|credential|api key|auth|real credentials)\b/],
    ['trading-or-money', /\b(trading|recommendation behavior|real backtest|paid market data|user money|high-stakes)\b/],
    ['destructive-or-irreversible', /\b(destructive|irreversible|rm -rf|drop table|external side effect)\b/],
  ];

  for (const [reason, pattern] of forced4) {
    if (pattern.test(lower)) reasons.push({ depth: 4, reason });
  }

  const forced3 = [
    ['shared-routing-policy', /\b(router|routing|skill activation|classifier|prompt hook|hook)\b/],
    ['schema-storage-provider', /\b(schema|migration|storage|duckdb|pit|provider)\b/],
    ['ci-release-shared-config', /\b(ci\/cd|ci|release|shared config|coverage gate)\b/],
    ['broad-cross-module', /\b(broad refactor|cross-module|adapter interfaces)\b/],
  ];

  for (const [reason, pattern] of forced3) {
    if (pattern.test(lower)) reasons.push({ depth: 3, reason });
  }

  return reasons;
}

function loadSkillRules() {
  try {
    const rulesPath = path.join(__dirname, 'skill-rules.json');
    return JSON.parse(fs.readFileSync(rulesPath, 'utf8')).rules || [];
  } catch {
    return [];
  }
}

function matchSkills(prompt, rules = loadSkillRules()) {
  const lower = String(prompt || '').toLowerCase();
  const matches = [];

  for (const rule of rules) {
    let score = 0;

    for (const keyword of rule.keywords || []) {
      const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = keyword.includes(' ') ? new RegExp(escaped) : new RegExp(`\\b${escaped}`);
      if (pattern.test(lower)) score += 1;
    }

    for (const source of rule.intentPatterns || []) {
      try {
        const pattern = new RegExp(source, 'i');
        if (pattern.test(prompt)) score += 2;
      } catch {
        // Ignore invalid external rules.
      }
    }

    if (score >= 2) {
      matches.push({
        skill: rule.skill,
        priority: rule.priority || 'medium',
        score,
      });
    }
  }

  matches.sort((a, b) => {
    const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    return b.score - a.score;
  });

  return matches.slice(0, 3).map((match) => match.skill);
}

function compactContext(result) {
  if (result.depth === 0) return '';
  if (result.depth === 1) return 'Depth 1: act directly and verify only the requested outcome.';
  if (result.depth === 2) return 'Depth 2: use a short checklist and focused verification.';
  if (result.depth === 3) return `Depth 3: use structured planning and verification.${result.suggestedSkills.length ? ` Suggested skills: ${result.suggestedSkills.join(', ')}.` : ''}`;
  return `Depth 4 approval required: ${result.forcedReasons.join(', ')}. State the concrete risk and wait for explicit approval before risky action.`;
}

function classifyPrompt(prompt, options = {}) {
  const mode = normalizeMode(options.mode, prompt);
  const scores = scorePrompt(prompt);
  const reasons = forcedReasons(prompt);
  const known = knownDepth(prompt);
  const total = SCORE_FIELDS.reduce((sum, field) => sum + scores[field], 0);

  let depth = known === null ? scoreToDepth(total) : known;

  const hasForced4 = reasons.some((item) => item.depth === 4);
  const hasForced3 = reasons.some((item) => item.depth === 3);

  if (hasForced4) {
    depth = 4;
  } else if (hasForced3) {
    depth = Math.max(depth, 3);
  }

  if (!hasForced4 && !hasForced3) {
    if (mode === 'fast') {
      if (depth <= 2) depth = Math.min(depth, 1);
      else depth = Math.max(2, depth - 1);
    } else if (mode === 'strict' && depth > 0) {
      depth = Math.max(depth, 3);
    }
  }

  const suggestedSkills = depth === 0 ? [] : matchSkills(prompt);
  const forcedReasonStrings = reasons
    .filter((item) => item.depth === 4 || (item.depth === 3 && depth >= 3))
    .map((item) => item.reason);

  const result = {
    depth,
    mode,
    scores,
    forcedReasons: forcedReasonStrings,
    suggestedSkills,
    approvalRequired: depth === 4,
    additionalContext: '',
  };
  result.additionalContext = compactContext(result);
  return result;
}

if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  const result = classifyPrompt(input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

module.exports = {
  SCHEMA_MODES,
  classifyPrompt,
  matchSkills,
  normalizeMode,
  scorePrompt,
  scoreToDepth,
};
