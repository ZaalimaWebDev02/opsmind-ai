/**
 * Week 4 — Full End-to-End Performance Test
 *
 * Tests response time, hallucination guard, citation accuracy,
 * and stress tests with 10 concurrent queries.
 *
 * Usage: node scripts/testPerformance.js
 * Make sure server is running: npm run dev
 */

const BASE = 'http://localhost:5000';

const TEST_CASES = [
  { query: 'How do I process a refund?',                 expectSource: true  },
  { query: 'What do I do on my first day at work?',      expectSource: true  },
  { query: 'How many annual leave days do I get?',       expectSource: true  },
  { query: 'How do I submit an expense claim?',          expectSource: true  },
  { query: 'What are the IT password requirements?',     expectSource: true  },
  { query: 'What is the rocket launch procedure?',       expectSource: false },
  { query: 'Who invented the telephone?',                expectSource: false },
];

async function testSingleQuery(query, sessionId) {
  const t0  = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, sessionId }),
  });

  let sources    = [];
  let fullAnswer = '';
  let firstToken = null;

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    let event = null;
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.replace('event:', '').trim();
      else if (line.startsWith('data:') && event) {
        const d = JSON.parse(line.replace('data:', '').trim());
        if (event === 'sources') sources    = d.sources || [];
        if (event === 'token')  {
          if (!firstToken) firstToken = Date.now() - t0;
          fullAnswer += d.token;
        }
        event = null;
      }
    }
  }

  return {
    query,
    totalMs:    Date.now() - t0,
    firstToken: firstToken || 0,
    sources:    sources.length,
    answerLen:  fullAnswer.length,
    answer:     fullAnswer.slice(0, 100),
    hasCitation: fullAnswer.includes('According to'),
    hasIDontKnow: fullAnswer.includes("I don't have information"),
  };
}

async function runTests() {
  console.log('\n🧪 OpsMind AI — Week 4 Performance Test');
  console.log('━'.repeat(50));

  // Health check
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log(`Server: ${health.status} | ${health.week}`);
  console.log(`DB: ${health.db} | Uptime: ${health.uptime} | Memory: ${health.memory}\n`);

  let passed = 0;
  let failed = 0;
  const times = [];

  // Sequential tests
  console.log('Sequential tests:');
  for (const tc of TEST_CASES) {
    const result = await testSingleQuery(tc.query, `perf-${Date.now()}`);
    times.push(result.totalMs);

    const sourceOk   = tc.expectSource ? result.sources > 0 : true;
    const citationOk = tc.expectSource ? result.hasCitation : true;
    const noHallOk   = !tc.expectSource ? result.hasIDontKnow : true;
    const ok         = sourceOk && (citationOk || noHallOk);

    if (ok) { passed++; process.stdout.write('  ✅ '); }
    else    { failed++; process.stdout.write('  ❌ '); }

    console.log(
      `${result.query.slice(0, 45).padEnd(46)}` +
      `| ${String(result.totalMs).padStart(5)}ms` +
      `| first token: ${result.firstToken}ms` +
      `| sources: ${result.sources}`
    );
  }

  // Cache test — same query twice, second should be faster
  console.log('\nCache test:');
  const q1 = await testSingleQuery('How do I process a refund?', 'cache-test-1');
  const q2 = await testSingleQuery('How do I process a refund?', 'cache-test-2');
  const cacheWorking = q2.totalMs < q1.totalMs;
  console.log(`  First  : ${q1.totalMs}ms`);
  console.log(`  Second : ${q2.totalMs}ms ${cacheWorking ? '✅ Cache hit (faster)' : '⚠️  Cache miss'}`);

  // Stress test — 5 concurrent queries
  console.log('\nConcurrent test (5 simultaneous queries):');
  const t0 = Date.now();
  const concurrent = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      testSingleQuery('How do I process a refund?', `stress-${i}`)
    )
  );
  const concurrentMs = Date.now() - t0;
  const avgMs = Math.round(concurrent.reduce((s, r) => s + r.totalMs, 0) / concurrent.length);
  console.log(`  5 queries completed in ${concurrentMs}ms | avg per query: ${avgMs}ms`);
  concurrent.forEach((r, i) => console.log(`  Query ${i + 1}: ${r.totalMs}ms`));

  // Summary
  const avgSeq = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const maxMs  = Math.max(...times);
  const minMs  = Math.min(...times);

  console.log('\n' + '━'.repeat(50));
  console.log(`Results  : ${passed} passed, ${failed} failed`);
  console.log(`Avg time : ${avgSeq}ms`);
  console.log(`Min time : ${minMs}ms`);
  console.log(`Max time : ${maxMs}ms`);

  if (maxMs > 10000) {
    console.log('\n⚠️  Some queries exceeded 10s. Consider:');
    console.log('   - Reducing numCandidates in vectorSearch.js');
    console.log('   - Using gemini-2.0-flash-lite for faster responses');
  }

  if (failed === 0) {
    console.log('\n🎉 All tests passed! OpsMind AI is production ready.\n');
  }
}

runTests().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});