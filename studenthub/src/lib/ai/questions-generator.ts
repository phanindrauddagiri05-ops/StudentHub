// ============================================================
// StudentHub — Server-Side Question Generator Engine
// Supports Gemini, OpenAI, and analytical question synthesis
// from real study material. API keys remain on server only.
// ============================================================

import { QuestionItem, QuestionDifficulty, QuestionType } from '@/types/database';

export interface GenerateQuestionsInput {
  text: string;
  title?: string;
  count: number;
  difficulty: QuestionDifficulty;
  type: QuestionType;
}

/**
 * Builds the AI prompt for question generation.
 */
function buildPrompt(input: GenerateQuestionsInput): string {
  return `You are StudentHub's AI Exam Preparation & Question Generator.
Analyze the following study material and generate exactly ${input.count} high-quality academic questions.

Requirements:
- Difficulty Level: ${input.difficulty.toUpperCase()}
- Question Type: ${input.type === 'mixed' ? 'A mix of Multiple Choice (MCQ), True/False, and Short Answer' : input.type.toUpperCase()}
- Target Question Count: ${input.count}

You MUST format your output as a strict JSON object with a "questions" array.
Each question object MUST have the following structure:
{
  "id": "q1",
  "question": "Clear, precise question text",
  "type": "mcq" | "short_answer" | "true_false" | "fill_blank",
  "difficulty": "${input.difficulty}",
  "options": ["Option A", "Option B", "Option C", "Option D"], // required if type is mcq or true_false (e.g. ["True", "False"])
  "correctAnswer": "The exact correct option or answer text",
  "explanation": "A concise explanation explaining why this answer is correct and citing the concept from the material."
}

Do NOT wrap the JSON in backticks, markdown code blocks, or extra text. Return ONLY the raw JSON object.

Study Material:
${input.text.slice(0, 15000)}`;
}

/**
 * Call Gemini 1.5 Flash
 */
async function callGemini(apiKey: string, prompt: string): Promise<QuestionItem[] | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    const questions = parsed.questions || parsed;
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q: any, idx: number) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        question: String(q.question || ''),
        type: (q.type || 'mcq') as QuestionType,
        difficulty: (q.difficulty || 'medium') as QuestionDifficulty,
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        correctAnswer: String(q.correctAnswer || ''),
        explanation: String(q.explanation || ''),
      }));
    }
    return null;
  } catch (err) {
    console.warn('Gemini question generation error:', err);
    return null;
  }
}

/**
 * Call OpenAI GPT-4o mini
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<QuestionItem[] | null> {
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const questions = parsed.questions || parsed;
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q: any, idx: number) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        question: String(q.question || ''),
        type: (q.type || 'mcq') as QuestionType,
        difficulty: (q.difficulty || 'medium') as QuestionDifficulty,
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        correctAnswer: String(q.correctAnswer || ''),
        explanation: String(q.explanation || ''),
      }));
    }
    return null;
  } catch (err) {
    console.warn('OpenAI question generation error:', err);
    return null;
  }
}

/**
 * Heuristic Analytical Question Synthesizer
 * Generates realistic exam questions directly from text sentences, definitions,
 * and key statements when no external API key is configured.
 */
export function generateAnalyticalQuestions(input: GenerateQuestionsInput): QuestionItem[] {
  const sentences = input.text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 30 && s.length < 300);

  const questions: QuestionItem[] = [];
  const targetCount = Math.max(1, Math.min(input.count, 20));

  // Extract candidate concepts and definitions
  const definitionSentences = sentences.filter((s) =>
    /\b(is|are|refers to|defined as|means|consists of|characterized by|primary|function|key|used to)\b/i.test(s)
  );

  const pool = definitionSentences.length >= targetCount ? definitionSentences : sentences;

  for (let i = 0; i < targetCount; i++) {
    const rawSentence = pool[i % pool.length] || `Core academic principle ${i + 1} describes the foundational mechanism.`;
    const qType: QuestionType =
      input.type === 'mixed'
        ? i % 3 === 0
          ? 'mcq'
          : i % 3 === 1
          ? 'true_false'
          : 'short_answer'
        : input.type;

    if (qType === 'true_false') {
      const isTrue = i % 2 === 0;
      let questionText = rawSentence;
      if (!isTrue) {
        questionText = rawSentence.replace(/\b(is|are|can|will|should)\b/i, '$1 not');
      }
      questions.push({
        id: `q_tf_${Date.now()}_${i + 1}`,
        question: `True or False: ${questionText}`,
        type: 'true_false',
        difficulty: input.difficulty,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: `Based on the study material: "${rawSentence}"`,
      });
    } else if (qType === 'short_answer') {
      const words = rawSentence.split(' ');
      const keyPhrase = words.slice(0, Math.min(4, words.length)).join(' ');
      questions.push({
        id: `q_sa_${Date.now()}_${i + 1}`,
        question: `Explain the significance and role of ${keyPhrase} in the context of the study material.`,
        type: 'short_answer',
        difficulty: input.difficulty,
        correctAnswer: rawSentence,
        explanation: `The material highlights: "${rawSentence}"`,
      });
    } else if (qType === 'fill_blank') {
      const words = rawSentence.split(' ');
      const targetWordIdx = Math.max(1, Math.floor(words.length / 2));
      const targetWord = words[targetWordIdx].replace(/[.,!?;:]/g, '');
      words[targetWordIdx] = '_______';
      questions.push({
        id: `q_fb_${Date.now()}_${i + 1}`,
        question: `Complete the statement: "${words.join(' ')}"`,
        type: 'fill_blank',
        difficulty: input.difficulty,
        correctAnswer: targetWord,
        explanation: `The complete original statement is: "${rawSentence}"`,
      });
    } else {
      // Default: MCQ
      const words = rawSentence.split(' ');
      const subject = words.slice(0, Math.min(3, words.length)).join(' ');
      const correctAns = rawSentence;
      const plausibleDistractors = [
        `It operates independently of the underlying theoretical structure.`,
        `It is solely restricted to non-computational applications.`,
        `It has been superseded by legacy architectures.`,
        `It does not require verified experimental parameters.`,
      ];

      const options = [correctAns, ...plausibleDistractors.slice(0, 3)].sort(() => (i % 2 === 0 ? 0.5 : -0.5));

      questions.push({
        id: `q_mcq_${Date.now()}_${i + 1}`,
        question: `According to the provided material, which of the following accurately describes ${subject}?`,
        type: 'mcq',
        difficulty: input.difficulty,
        options,
        correctAnswer: correctAns,
        explanation: `Direct citation from text: "${rawSentence}"`,
      });
    }
  }

  return questions;
}

/**
 * Main Question Generation Entrypoint
 */
export async function generateQuestions(input: GenerateQuestionsInput): Promise<QuestionItem[]> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const prompt = buildPrompt(input);

  if (geminiKey) {
    const geminiQuestions = await callGemini(geminiKey, prompt);
    if (geminiQuestions && geminiQuestions.length > 0) {
      return geminiQuestions;
    }
  }

  if (openaiKey) {
    const openaiQuestions = await callOpenAI(openaiKey, prompt);
    if (openaiQuestions && openaiQuestions.length > 0) {
      return openaiQuestions;
    }
  }

  return generateAnalyticalQuestions(input);
}
