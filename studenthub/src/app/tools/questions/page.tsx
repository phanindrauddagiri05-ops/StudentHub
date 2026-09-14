'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  Sparkles,
  Copy,
  Download,
  Bookmark,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
  Eye,
  EyeOff,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { saveQuestionSetRecord, getQuestionSetRecord } from '@/lib/storage/file-service';
import { QuestionItem, QuestionDifficulty, QuestionType, QuestionSetData } from '@/types/database';
import styles from './questions.module.css';

function QuestionsStudio() {
  const searchParams = useSearchParams();
  const qsetIdParam = searchParams.get('id');
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [studyText, setStudyText] = useState('');
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Load saved question set if ID is present
  useEffect(() => {
    if (qsetIdParam) {
      getQuestionSetRecord(qsetIdParam).then((saved) => {
        if (saved) {
          setTitle(saved.title);
          setQuestions(saved.questions);
          setDifficulty(saved.difficulty);
          setQuestionType(saved.questionType);
          setIsSaved(true);
          showToast(`Loaded "${saved.title}"`);
        }
      });
    }
  }, [qsetIdParam]);

  const handleGenerate = async () => {
    if (!studyText.trim()) {
      showToast('Please enter study material first.');
      return;
    }

    setLoading(true);
    setIsSaved(false);
    setUserAnswers({});
    setShowAnswers({});

    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: studyText,
          title: title || 'Exam Question Set',
          count,
          difficulty,
          type: questionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions.');
      }

      setQuestions(data.questions || []);
      if (!title) {
        setTitle(data.title || 'Exam Question Set');
      }

      // Automatically save to local history
      const setPayload: QuestionSetData = {
        title: title || data.title || 'Exam Question Set',
        sourceTextPreview: studyText.slice(0, 150),
        questions: data.questions || [],
        difficulty,
        questionCount: data.questions?.length || count,
        questionType,
      };

      await saveQuestionSetRecord({
        id: data.id,
        userId: user?.id || 'guest',
        title: setPayload.title,
        data: setPayload,
      });
      setIsSaved(true);

      showToast(`Generated ${data.questions.length} questions!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating questions';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (qId: string) => {
    setShowAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSelectOption = (qId: string, option: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSaveSet = async () => {
    if (questions.length === 0) return;
    const setId = qsetIdParam || `qset_${Date.now()}`;
    const cleanTitle = title.trim() || 'Exam Question Set';

    const setPayload: QuestionSetData = {
      title: cleanTitle,
      sourceTextPreview: studyText.slice(0, 150),
      questions,
      difficulty,
      questionCount: questions.length,
      questionType,
    };

    await saveQuestionSetRecord({
      id: setId,
      userId: user?.id || 'guest',
      title: cleanTitle,
      data: setPayload,
    });
    setIsSaved(true);
    showToast('Saved to your History!');
  };

  const handleCopyQuestions = () => {
    if (questions.length === 0) return;
    let formatted = `QUESTION SET: ${title || 'Exam Preparation'}\n`;
    formatted += `Difficulty: ${difficulty.toUpperCase()} | Count: ${questions.length}\n\n`;

    questions.forEach((q, idx) => {
      formatted += `${idx + 1}. [${q.type.toUpperCase()}] ${q.question}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          formatted += `   ${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
        });
      }
      formatted += `   Correct Answer: ${q.correctAnswer}\n`;
      formatted += `   Explanation: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(formatted);
    showToast('Copied questions & answers to clipboard!');
  };

  const handleDownloadMarkdown = () => {
    if (questions.length === 0) return;
    let md = `# ${title || 'Exam Question Set'}\n`;
    md += `*Difficulty: ${difficulty.toUpperCase()} • Questions: ${questions.length} • Type: ${questionType}*\n\n---\n\n`;

    questions.forEach((q, idx) => {
      md += `### Question ${idx + 1}\n`;
      md += `${q.question}\n\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          md += `- **${String.fromCharCode(65 + oIdx)}.** ${opt}\n`;
        });
        md += `\n`;
      }
      md += `> **Answer:** ${q.correctAnswer}\n`;
      md += `> **Explanation:** ${q.explanation}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'question-set').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded question set as Markdown!');
  };

  const handleReset = () => {
    setQuestions([]);
    setStudyText('');
    setTitle('');
    setUserAnswers({});
    setShowAnswers({});
    setIsSaved(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.phaseBadge}>
            <HelpCircle size={13} />
            Phase 6 • Exam Prep
          </span>
        </div>
        <h1 className={styles.title}>Question Generator</h1>
        <p className={styles.subtitle}>
          Turn textbook chapters, study guides, or revision notes into exam questions, multiple choice tests, and practice sets.
        </p>
      </div>

      {/* Input Configuration Card */}
      {questions.length === 0 && (
        <div className={styles.configCard} id="question-config-card">
          <h2 className={styles.sectionTitle}>1. Enter Study Material</h2>

          <input
            type="text"
            placeholder="Question Set Title (e.g. Operating Systems Chapter 3 — Deadlocks)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          />

          <textarea
            rows={10}
            className={styles.textarea}
            value={studyText}
            onChange={(e) => setStudyText(e.target.value)}
            placeholder="Paste your lecture notes, textbook definitions, or syllabus topics here..."
            id="study-text-input"
          />

          <h2 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
            2. Configure Exam Parameters
          </h2>

          <div className={styles.optionsGrid}>
            <div>
              <label className={styles.label}>Number of Questions</label>
              <select
                className={styles.select}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                id="question-count-select"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>Difficulty</label>
              <select
                className={styles.select}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                id="question-difficulty-select"
              >
                <option value="easy">Easy (Definitions & Facts)</option>
                <option value="medium">Medium (Application & Analysis)</option>
                <option value="hard">Hard (Advanced Problem Solving)</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>Question Type</label>
              <select
                className={styles.select}
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                id="question-type-select"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="mixed">Mixed Format</option>
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={loading || !studyText.trim()}
            fullWidth
            id="generate-questions-btn"
          >
            <Sparkles size={18} style={{ marginRight: 8 }} />
            {loading ? 'Synthesizing Questions...' : 'Generate Exam Questions'}
          </Button>
        </div>
      )}

      {/* Questions Results View */}
      {questions.length > 0 && (
        <div>
          <div className={styles.resultsHeader}>
            <div>
              <div className={styles.resultsTitle}>{title || 'Exam Question Set'}</div>
              <div className={styles.resultsMeta}>
                {questions.length} questions • {difficulty.toUpperCase()} difficulty • {questionType}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyQuestions}
                id="copy-questions-btn"
              >
                <Copy size={14} style={{ marginRight: 6 }} />
                Copy All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadMarkdown}
                id="download-questions-btn"
              >
                <Download size={14} style={{ marginRight: 6 }} />
                Download MD
              </Button>
              <Button
                variant={isSaved ? 'ghost' : 'primary'}
                size="sm"
                onClick={handleSaveSet}
                id="save-questions-btn"
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <FileCheck2 size={14} style={{ marginRight: 6, color: '#059669' }} />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={14} style={{ marginRight: 6 }} />
                    Save
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} id="new-quiz-btn">
                <RotateCcw size={14} style={{ marginRight: 6 }} />
                New Questions
              </Button>
            </div>
          </div>

          <div className={styles.questionsList}>
            {questions.map((q, idx) => {
              const isAnswerShown = Boolean(showAnswers[q.id]);
              const chosenOption = userAnswers[q.id];

              return (
                <div key={q.id} className={styles.questionCard} id={`question-item-${idx + 1}`}>
                  <div className={styles.questionHeader}>
                    <div className={styles.questionNumber}>{idx + 1}</div>
                    <div className={styles.questionText}>{q.question}</div>
                    <div className={styles.tagsRow}>
                      <span className={styles.tag}>{q.type}</span>
                      <span className={styles.tag}>{q.difficulty}</span>
                    </div>
                  </div>

                  {/* MCQ / Options list */}
                  {q.options && q.options.length > 0 && (
                    <div className={styles.optionsList}>
                      {q.options.map((opt, oIdx) => {
                        const isChosen = chosenOption === opt;
                        const isCorrect = isAnswerShown && opt.trim() === q.correctAnswer.trim();
                        const isWrongSelection =
                          isAnswerShown && isChosen && opt.trim() !== q.correctAnswer.trim();

                        return (
                          <div
                            key={oIdx}
                            className={[
                              styles.optionItem,
                              isCorrect ? styles.optionCorrect : '',
                              isWrongSelection ? styles.optionSelectedWrong : '',
                            ].join(' ')}
                            onClick={() => handleSelectOption(q.id, opt)}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: isChosen ? '#dc2626' : '#f1f5f9',
                                color: isChosen ? '#fff' : '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                marginRight: 10,
                                flexShrink: 0,
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Toggle Answer button */}
                  <button
                    type="button"
                    className={styles.toggleAnswerBtn}
                    onClick={() => toggleAnswer(q.id)}
                  >
                    {isAnswerShown ? (
                      <>
                        <EyeOff size={14} /> Hide Answer & Explanation
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Show Answer & Explanation
                      </>
                    )}
                  </button>

                  {/* Revealed Answer Box */}
                  {isAnswerShown && (
                    <div className={styles.answerBox}>
                      <div className={styles.answerLabel}>Correct Answer</div>
                      <div className={styles.answerContent}>{q.correctAnswer}</div>
                      <div className={styles.explanationText}>
                        <strong>Concept Citation:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Question Generator...</div>}>
      <QuestionsStudio />
    </Suspense>
  );
}
