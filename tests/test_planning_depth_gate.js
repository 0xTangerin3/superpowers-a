const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { classifyPrompt, SCHEMA_MODES } = require('../hooks/planning-depth-gate');

const fixtureDir = path.join(__dirname, 'fixtures', 'planning-depth');
const fixtureFiles = fs.readdirSync(fixtureDir).filter((file) => file.endsWith('.json')).sort();

function normalizeExpectedDepth(expectedDepth) {
  return Array.isArray(expectedDepth) ? expectedDepth : [expectedDepth];
}

function validateSchema(result) {
  assert(Number.isInteger(result.depth), 'depth must be an integer');
  assert(result.depth >= 0 && result.depth <= 4, 'depth must be 0-4');
  assert(SCHEMA_MODES.includes(result.mode), `invalid mode ${result.mode}`);
  for (const field of ['scope', 'risk', 'unknowns', 'blast_radius', 'reversibility']) {
    assert(Number.isInteger(result.scores[field]), `missing numeric score ${field}`);
    assert(result.scores[field] >= 0 && result.scores[field] <= 2, `${field} score out of range`);
  }
  assert(Array.isArray(result.forcedReasons), 'forcedReasons must be an array');
  assert(Array.isArray(result.suggestedSkills), 'suggestedSkills must be an array');
  assert(result.suggestedSkills.length <= 3, 'suggestedSkills must be capped at 3');
  assert.strictEqual(typeof result.approvalRequired, 'boolean', 'approvalRequired must be boolean');
  assert.strictEqual(typeof result.additionalContext, 'string', 'additionalContext must be string');
}

for (const file of fixtureFiles) {
  const fixtures = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
  for (const fixture of fixtures) {
    const result = classifyPrompt(fixture.prompt, { mode: fixture.mode });
    validateSchema(result);

    assert(
      normalizeExpectedDepth(fixture.expectedDepth).includes(result.depth),
      `${file}: ${fixture.prompt} expected depth ${fixture.expectedDepth}, got ${result.depth}`
    );

    if ('expectedApproval' in fixture) {
      assert.strictEqual(
        result.approvalRequired,
        fixture.expectedApproval,
        `${file}: ${fixture.prompt} approval mismatch`
      );
    }

    if (fixture.expectedSkill) {
      assert(
        result.suggestedSkills.includes(fixture.expectedSkill),
        `${file}: ${fixture.prompt} expected skill ${fixture.expectedSkill}; got ${result.suggestedSkills.join(', ')}`
      );
    }

    if (fixture.forbiddenSkill) {
      assert(
        !result.suggestedSkills.includes(fixture.forbiddenSkill),
        `${file}: ${fixture.prompt} should not suggest ${fixture.forbiddenSkill}`
      );
    }

    if (result.depth === 4) {
      assert.strictEqual(result.approvalRequired, true, `${file}: depth 4 must require approval`);
      assert(result.forcedReasons.length > 0, `${file}: depth 4 must explain forced reason`);
    }
  }
}

console.log(`planning-depth-gate: ${fixtureFiles.length} fixture files passed`);
