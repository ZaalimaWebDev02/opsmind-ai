/**
 * Week 2 Test Script — Chat API End-to-End Test
 *
 * Tests the full chat pipeline via HTTP:
 * query → vector search → Gemini stream → SSE response
 *
 * Usage:
 *   node scripts/testChat.js
 *
 * Make sure server is running first: npm run dev
 */

const BASE_URL  = 'http://localhost:5000';
const SESSION_ID = `test-week2-${Date.now()}`;

// Test cases: question + what the answer MUST contain
const TEST_CASES = [
  {
    query:       'How do I process a refund?',
    mustContain: ['refund', 'According to'],
    label:       'Refund policy',
  },
  {
    query:       'What do I do on my first day at work?',
    mustContain: ['badge', 'According to'],
    label:       'Onboarding',
  },
  {
    query:       'How do I claim travel expenses?',
    mustContain: ['Concur', 'According to'],
    label:       'Expense reimbursement',
  },
  {
    query:       'What is the annual leave entitlement?',
    mustContain: ['20', 'According to'],
    label:       'Leave policy',
  },
];

// Hallucination test — must NOT give a real answer
const HALLUCINATION_TEST = {
  query:       'What is the procedure for launching a space rocket?',
  mustContain: ["I don't have information about that in the current SOPs"],
  label:       'Hallucination guard',
};

async function testChatEndpoint(query, sessionId) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, sessionId }),
  });

  let sources    = null;
  let fullAnswer = '';
  let done       = false;

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.replace('event:', '').trim();
      } else if (line.startsWith('data:') && currentEvent) {
        const payload = JSON.parse(line.replace('data:', '').trim());
        if (currentEvent === 'sources')  sources     = payload.sources;
        if (currentEvent === 'token')    fullAnswer += payload.token;
        if (currentEvent === 'done')     done        = true;
        if (currentEvent === 'error')    throw new Error(payload.message);
        currentEvent = null;
      }
    }
  }

  return { sources, fullAnswer, done };
}

async function main() {
  console.log('\n🧪 OpsMind AI — Week 2 Chat API Test');
  console.log('━'.repeat(45));
  console.log(`Server: ${BASE_URL}`);
  console.log(`Session: ${SESSION_ID}\n`);

  // Health check first
  const health = await fetch(`${BASE_URL}/health`).then(r => r.json());
  console.log(`Health: ${health.status} | ${health.week}\n`);

  let passed = 0;
  let failed = 0;

  // Run main test cases
  const allTests = [...TEST_CASES, HALLUCINATION_TEST];

  for (const tc of allTests) {
    process.stdout.write(`Testing: ${tc.label}...`);

    try {
      const { sources, fullAnswer, done } = await testChatEndpoint(
        tc.query,
        `${SESSION_ID}-${tc.label.replace(/\s/g, '-')}`
      );

      const answerLower = fullAnswer.toLowerCase();
      const allMatch    = tc.mustContain.every(
        phrase => fullAnswer.toLowerCase().includes(phrase.toLowerCase())
      );

      if (allMatch && done) {
        console.log(' ✅ PASS');
        console.log(`   Sources: ${sources?.length ?? 0} | Answer: "${fullAnswer.slice(0, 80)}..."`);
        passed++;
      } else {
        console.log(' ❌ FAIL');
        console.log(`   Expected to contain: ${tc.mustContain.join(', ')}`);
        console.log(`   Got: "${fullAnswer.slice(0, 120)}"`);
        failed++;
      }
    } catch (err) {
      console.log(` ❌ ERROR: ${err.message}`);
      failed++;
    }

    console.log('');
  }

  // Check history saved
  console.log('Testing: Chat history persistence...');
  const historyRes  = await fetch(`${BASE_URL}/api/chat/sessions`);
  const historyData = await historyRes.json();

  if (historyData.count > 0) {
    console.log(`  ✅ ${historyData.count} session(s) saved in MongoDB`);
    passed++;
  } else {
    console.log('  ❌ No sessions found in MongoDB');
    failed++;
  }

  console.log('\n' + '━'.repeat(45));
  console.log(`Results: ${passed} passed, ${failed} failed out of ${allTests.length + 1} tests`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Week 2 complete.');
    console.log('   Ready for Week 3 — React Frontend + Streaming UI\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check server logs for details.\n');
  }
}

main().catch(err => {
  console.error('\n❌ Test script error:', err.message);
  process.exit(1);
});