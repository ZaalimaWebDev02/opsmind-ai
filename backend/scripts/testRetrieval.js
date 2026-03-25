/**
 * Week 2 Test Script — Vector Search Retrieval
 *
 * Tests the full retrieval pipeline directly against MongoDB Atlas.
 * Run BEFORE testing the HTTP endpoint to isolate any issues.
 *
 * Usage:
 *   node scripts/testRetrieval.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('\n🧪 OpsMind AI — Week 2 Retrieval Test');
  console.log('━'.repeat(45));

  try {
    // ── Connect to MongoDB ────────────────────────────────────────────────
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI missing in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // ── Import services (FIXED PATH) ──────────────────────────────────────
    const {
      retrieveRelevantChunks,
      buildContextWindow,
    } = require('../src/services/vectorSearch'); // ✅ correct path

    // ── Test cases ────────────────────────────────────────────────────────
    const testCases = [
      { query: 'How do I process a refund?',               expectPage: 1 },
      { query: 'What is the employee onboarding process?', expectPage: 2 },
      { query: 'How do I submit expense reimbursement?',   expectPage: 3 },
      { query: 'How many annual leave days do I get?',     expectPage: 4 },
      { query: 'What are the password requirements?',      expectPage: 5 },
    ];

    let passed = 0;
    let failed = 0;

    for (const tc of testCases) {
      console.log(`\n💬 Query: "${tc.query}"`);

      try {
        const chunks = await retrieveRelevantChunks(tc.query, 3);

        if (!chunks || chunks.length === 0) {
          console.log('  ❌ FAILED — No chunks returned');
          console.log('     Fix: Check Atlas vector_index is ACTIVE');
          failed++;
          continue;
        }

        const top = chunks[0];

        console.log(`  ✅ Top result:`);
        console.log(`     File  : ${top.fileName}`);
        console.log(`     Page  : ${top.pageNumber}`);
        console.log(`     Score : ${top.score?.toFixed(4)}`);
        console.log(`     Text  : "${top.text.slice(0, 90)}..."`);

        // Score validation
        if (!top.score || top.score < 0.75) {
          console.log(`  ⚠️  Low score (${top.score?.toFixed(4)} < 0.75)`);
          failed++;
        } else {
          passed++;
        }

      } catch (err) {
        console.log(`  ❌ ERROR: ${err.message}`);
        failed++;
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n' + '━'.repeat(45));
    console.log(`Results: ${passed} passed, ${failed} failed`);

    // ── Hallucination Guard Test ──────────────────────────────────────────
    console.log('\n🧠 Hallucination guard test:');
    console.log('Query: "What is the rocket launch procedure?"');

    try {
      const noChunks = await retrieveRelevantChunks(
        'What is the rocket launch procedure?'
      );

      const prompt = buildContextWindow(
        'What is the rocket launch procedure?',
        noChunks
      );

      if (!noChunks || noChunks.length === 0) {
        console.log('  ✅ Correct — No chunks returned');
        console.log('  🤖 LLM should respond: "I don’t know based on provided data"');
      } else {
        console.log(`  ⚠️  Returned ${noChunks.length} chunks`);
        console.log('     👉 Consider increasing MIN_SCORE threshold');
      }

    } catch (err) {
      console.log(`  ❌ Hallucination test error: ${err.message}`);
    }

    // ── Disconnect ────────────────────────────────────────────────────────
    await mongoose.disconnect();
    console.log('\n✅ Retrieval test complete\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();