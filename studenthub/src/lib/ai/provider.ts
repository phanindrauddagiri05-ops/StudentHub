// ============================================================
// StudentHub — Server-Side AI Provider & Chunking Engine
// Supports Gemini, OpenAI, and smart analytical fallback for
// local evaluation or offline environments.
// ============================================================

export interface GeneratedSummary {
  overview: string;
  keyPoints: string[];
  importantDetails: string[];
  conclusions: string;
  providerUsed: string;
  chunkCount: number;
}

const CHUNK_SIZE_CHARS = 10000;
const CHUNK_OVERLAP_CHARS = 800;

/**
 * Splits text into overlapping chunks if it exceeds the chunk limit.
 */
export function chunkText(text: string, maxChunk = CHUNK_SIZE_CHARS, overlap = CHUNK_OVERLAP_CHARS): string[] {
  if (text.length <= maxChunk) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChunk, text.length);

    if (endIndex < text.length) {
      // Try to break on paragraph or sentence boundary
      const boundaryIndex = text.lastIndexOf('\n\n', endIndex);
      if (boundaryIndex > startIndex + maxChunk * 0.5) {
        endIndex = boundaryIndex + 2;
      } else {
        const sentenceIndex = text.lastIndexOf('. ', endIndex);
        if (sentenceIndex > startIndex + maxChunk * 0.5) {
          endIndex = sentenceIndex + 2;
        }
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (endIndex >= text.length) {
      break;
    }

    const nextIndex = endIndex - overlap;
    if (nextIndex <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextIndex;
    }
  }

  return chunks;
}

/**
 * Generates a prompt for summarizing document text into the required 4-part structure.
 */
function buildPrompt(text: string, filename: string): string {
  return `You are StudentHub's AI Academic Document Summarizer.
Analyze the following text extracted from the document "${filename}" and generate a clear, structured academic summary.

You MUST format your output as a strict JSON object with exactly these four keys:
{
  "overview": "A comprehensive, readable 2-4 paragraph overview explaining what the document is about, its context, and main narrative.",
  "keyPoints": [
    "First main takeaway or concept",
    "Second main takeaway or concept",
    "Third main takeaway or concept",
    "Fourth main takeaway or concept",
    "Fifth main takeaway or concept"
  ],
  "importantDetails": [
    "Crucial detail, formula, definition, metric, or supporting argument",
    "Another specific finding or critical observation",
    "Key methodology or factual context"
  ],
  "conclusions": "A coherent concluding summary of actionable takeaways, implications, and final reflections."
}

Do NOT wrap the JSON in backticks, markdown code blocks, or preamble. Return ONLY the raw JSON object.

Document text:
${text}`;
}

/**
 * Attempts Gemini API summary generation.
 */
async function callGemini(apiKey: string, prompt: string): Promise<GeneratedSummary | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API returned status:', response.status);
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      overview: String(parsed.overview || '').trim(),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
      importantDetails: Array.isArray(parsed.importantDetails) ? parsed.importantDetails.map(String) : [],
      conclusions: String(parsed.conclusions || '').trim(),
      providerUsed: 'Gemini (1.5 Flash)',
      chunkCount: 1,
    };
  } catch (err) {
    console.warn('Gemini API call failed:', err);
    return null;
  }
}

/**
 * Attempts OpenAI API summary generation.
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<GeneratedSummary | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API returned status:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      overview: String(parsed.overview || '').trim(),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
      importantDetails: Array.isArray(parsed.importantDetails) ? parsed.importantDetails.map(String) : [],
      conclusions: String(parsed.conclusions || '').trim(),
      providerUsed: 'OpenAI (GPT-4o mini)',
      chunkCount: 1,
    };
  } catch (err) {
    console.warn('OpenAI API call failed:', err);
    return null;
  }
}

/**
 * Intelligent analytical heuristic summary generator for local development,
 * offline use, or when no external AI API key is configured in the environment.
 * Parses the document's real paragraphs, key statements, definitions, and conclusions.
 */
export function generateAnalyticalSummary(text: string, filename: string, chunkCount = 1): GeneratedSummary {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 25);

  const cleanFilename = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  // 1. Overview
  let overview = '';
  if (paragraphs.length > 0) {
    overview = paragraphs.slice(0, Math.min(3, paragraphs.length)).join('\n\n');
  } else {
    overview = `This document provides comprehensive information regarding ${cleanFilename}. It contains structured content, data, and academic analysis across its subject matter.`;
  }

  // 2. Sentences extraction
  const allSentences: string[] = [];
  const rawSentences = text.split(/(?<=[.?!])\s+/);
  for (const s of rawSentences) {
    const trimmed = s.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 35 && trimmed.length < 250) {
      allSentences.push(trimmed);
    }
  }

  // 3. Key Points (Find sentences with informative indicators)
  const keyPoints: string[] = [];
  const keyIndicators = ['important', 'key', 'main', 'primary', 'conclude', 'result', 'finding', 'purpose', 'objective', 'demonstrates', 'analysis', 'significant', 'requires', 'essential'];
  
  for (const sentence of allSentences) {
    if (keyIndicators.some((word) => sentence.toLowerCase().includes(word))) {
      if (!keyPoints.includes(sentence)) {
        keyPoints.push(sentence);
      }
    }
    if (keyPoints.length >= 6) break;
  }

  // Fallback if not enough keyword matches
  if (keyPoints.length < 3) {
    const step = Math.max(1, Math.floor(allSentences.length / 5));
    for (let i = 0; i < allSentences.length && keyPoints.length < 5; i += step) {
      const s = allSentences[i];
      if (s && !keyPoints.includes(s)) {
        keyPoints.push(s);
      }
    }
  }

  // 4. Important Details
  const importantDetails: string[] = [];
  const detailIndicators = ['for example', 'such as', 'specifically', 'namely', 'consists of', 'defined as', 'percent', '%', 'table', 'figure', 'section', 'method', 'data'];
  for (const sentence of allSentences) {
    if (detailIndicators.some((word) => sentence.toLowerCase().includes(word))) {
      if (!keyPoints.includes(sentence) && !importantDetails.includes(sentence)) {
        importantDetails.push(sentence);
      }
    }
    if (importantDetails.length >= 4) break;
  }

  if (importantDetails.length < 2) {
    importantDetails.push(`Document: "${filename}" composed of approximately ${text.split(/\s+/).length} words across multiple academic and technical sections.`);
    importantDetails.push('The content outlines structured information suitable for exam revision, research notes, and core concept mastery.');
  }

  // 5. Conclusions
  let conclusions = '';
  if (paragraphs.length > 3) {
    conclusions = paragraphs[paragraphs.length - 1];
  } else if (allSentences.length > 0) {
    conclusions = allSentences[allSentences.length - 1];
  } else {
    conclusions = `The document concludes its examination of ${cleanFilename} with clear structural takeaways and academic applications.`;
  }

  return {
    overview,
    keyPoints: keyPoints.length > 0 ? keyPoints : [`Primary concept exploration in ${cleanFilename}.`, 'Core definitions and theoretical principles.'],
    importantDetails,
    conclusions,
    providerUsed: 'StudentHub AI Engine (Local Analyzer)',
    chunkCount,
  };
}

/**
 * Master PDF Summarization Coordinator.
 * Handles single-shot summarization or chunk-and-combine for long documents.
 */
export async function generatePdfSummary(text: string, filename: string): Promise<GeneratedSummary> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // Chunking logic for long documents
  const chunks = chunkText(text);

  // If text is within one chunk and an external provider key exists, try external API
  if (chunks.length === 1) {
    const prompt = buildPrompt(chunks[0], filename);

    if (geminiKey) {
      const geminiResult = await callGemini(geminiKey, prompt);
      if (geminiResult) return geminiResult;
    }

    if (openaiKey) {
      const openaiResult = await callOpenAI(openaiKey, prompt);
      if (openaiResult) return openaiResult;
    }

    return generateAnalyticalSummary(text, filename, 1);
  }

  // Multi-chunk processing for long documents
  // Summarize the chunks and then synthesize
  const chunkSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkPrompt = `Summarize chunk ${i + 1} of ${chunks.length} from document "${filename}" into key points and main ideas:\n\n${chunk}`;
    
    let subResult: GeneratedSummary | null = null;
    if (geminiKey) {
      subResult = await callGemini(geminiKey, chunkPrompt);
    } else if (openaiKey) {
      subResult = await callOpenAI(openaiKey, chunkPrompt);
    }

    if (subResult) {
      chunkSummaries.push(subResult.overview + '\n' + subResult.keyPoints.join('\n'));
    } else {
      const analytical = generateAnalyticalSummary(chunk, `${filename} (Part ${i + 1})`, 1);
      chunkSummaries.push(analytical.overview + '\n' + analytical.keyPoints.join('\n'));
    }
  }

  // Final Synthesis
  const combinedContext = chunkSummaries.join('\n\n--- Next Section ---\n\n');
  const finalPrompt = buildPrompt(combinedContext, filename);

  if (geminiKey) {
    const finalGemini = await callGemini(geminiKey, finalPrompt);
    if (finalGemini) {
      return { ...finalGemini, chunkCount: chunks.length };
    }
  }

  if (openaiKey) {
    const finalOpenAI = await callOpenAI(openaiKey, finalPrompt);
    if (finalOpenAI) {
      return { ...finalOpenAI, chunkCount: chunks.length };
    }
  }

  return generateAnalyticalSummary(text, filename, chunks.length);
}
