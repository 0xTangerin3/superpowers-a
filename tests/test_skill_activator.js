const assert = require('assert');

const { buildHookResponse } = require('../hooks/skill-activator');

const depth0 = buildHookResponse({ prompt: 'review this plan quickly', mode: 'normal' });
assert.deepStrictEqual(depth0, {}, 'depth 0 hook output must be empty');

const depth1 = buildHookResponse({
  prompt: 'Add this API key to ignored local .env without printing it.',
  mode: 'normal',
});
assert(depth1.additionalContext, 'depth 1 should emit bounded routing context');
assert(depth1.additionalContext.includes('"depth":1'), 'depth 1 context should include JSON first');
assert(depth1.additionalContext.length < 700, 'depth 1 context should stay compact');

const depth4 = buildHookResponse({
  prompt: 'Show me the production API key.',
  mode: 'fast',
});
assert(depth4.additionalContext, 'depth 4 should emit routing context');
assert(depth4.additionalContext.includes('"depth":4'), 'depth 4 context should include depth 4 JSON');
assert(depth4.additionalContext.includes('"approvalRequired":true'), 'depth 4 context should require approval');
assert(depth4.additionalContext.includes('approval'), 'depth 4 context should explain approval gate');

console.log('skill-activator: hook output behavior passed');
