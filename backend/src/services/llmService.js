const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Confirmed working models from your API key
const CHAT_MODELS = [
  'models/gemini-2.5-flash',
  'models/gemini-2.0-flash',
  'models/gemini-3.1-flash-lite',
  'models/gemini-2.5-pro',
  'models/gemini-1.5-flash',   // ✅ most reliable
  'models/gemini-1.5-pro',
];

let workingChatModel = null;

/**
 * Auto-detects the first working chat model from CHAT_MODELS list.
 * Result cached after first successful probe.
 */
const getWorkingChatModel = async () => {
  if (workingChatModel) return workingChatModel;

  for (const modelName of CHAT_MODELS) {
    try {
      process.stdout.write(`   Trying: ${modelName} ... `);
      const model  = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('say hi in one word');
      const text   = result.response.text();
      if (text) {
        console.log(`✅ WORKS`);
        console.log(`✅ Chat model set to: ${modelName}\n`);
        workingChatModel = modelName;
        return modelName;
      }
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 60)}`);
    }
  }

  throw new Error(
    'No working Gemini chat model found. Check your GEMINI_API_KEY in .env'
  );
};

/**
 * Streams Gemini response token by token via SSE.
 *
 * @param {string}   contextPrompt - Full prompt with SOP context + question
 * @param {Function} onChunk       - Called with each token string
 * @param {Function} onDone        - Called with full text when stream ends
 */
const streamAnswer = async (contextPrompt, onChunk, onDone) => {
  const modelName = await getWorkingChatModel();
  const model     = genAI.getGenerativeModel({ model: modelName });
  const result    = await model.generateContentStream(contextPrompt);

  let fullText = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  onDone(fullText);
  return fullText;
};

/**
 * Non-streaming version for testing.
 */
const getAnswer = async (contextPrompt) => {
  const modelName = await getWorkingChatModel();
  const model     = genAI.getGenerativeModel({ model: modelName });
  const result    = await model.generateContent(contextPrompt);
  return result.response.text();
};

module.exports = { streamAnswer, getAnswer, getWorkingChatModel };