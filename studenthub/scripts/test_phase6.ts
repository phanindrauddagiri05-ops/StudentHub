import { TOOLS } from '../src/lib/tools';
import { FEATURE_FLAGS } from '../src/lib/config/features';
import { generateQuestions } from '../src/lib/ai/questions-generator';
import { generateMindMap } from '../src/lib/ai/mindmap-generator';
import { saveMindMapRecord, getMindMapRecord, saveQuestionSetRecord, getQuestionSetRecord, getUnifiedHistory } from '../src/lib/storage/file-service';
import { POST as postQuestions } from '../src/app/api/questions/generate/route';
import { POST as postMindMap } from '../src/app/api/mind-maps/generate/route';
import { NextRequest } from 'next/server';

async function runPhase6Tests() {
  console.log('=== RUNNING PHASE 6 AUTOMATED TEST SUITE ===');

  // 1. Tool Registry & Feature Flags
  console.log('\n--- 1. Testing Feature Flags & Tool Registry ---');
  const availableTools = TOOLS.filter((t) => t.status === 'available');
  console.log('Available tools count:', availableTools.length);
  availableTools.forEach((t) => console.log(`  ✓ ${t.name} (${t.id}) -> ${t.path}`));

  if (availableTools.length !== 5) {
    throw new Error(`Expected exactly 5 available tools, found ${availableTools.length}`);
  }
  if (!FEATURE_FLAGS.MIND_MAPS) {
    throw new Error('FEATURE_FLAGS.MIND_MAPS must be true');
  }
  if (!FEATURE_FLAGS.QUESTIONS_GENERATOR) {
    throw new Error('FEATURE_FLAGS.QUESTIONS_GENERATOR must be true');
  }
  if (FEATURE_FLAGS.PDF_SUMMARY_AI) {
    throw new Error('FEATURE_FLAGS.PDF_SUMMARY_AI must remain false (locked as Coming Soon)');
  }
  if (FEATURE_FLAGS.RESUME_GENERATOR) {
    throw new Error('FEATURE_FLAGS.RESUME_GENERATOR must remain false (Phase 8)');
  }
  console.log('✓ Tool registry & feature flags verified successfully.');

  // 2. Mind Map Generation Service
  console.log('\n--- 2. Testing Mind Map Generation Service ---');
  const sampleNotes = `
Operating Systems Architecture
- Process Management
  - Context Switching
  - Process Control Block (PCB)
  - Inter-Process Communication
- Memory Hierarchy
  - L1 and L2 Caches
  - Translation Lookaside Buffer (TLB)
  - Demand Paging
- File Systems
  - Inode structure
  - Directory trees
  `;

  const mindMapResult = await generateMindMap({
    text: sampleNotes,
    title: 'Operating Systems Architecture',
  });

  console.log('Mind Map Title:', mindMapResult.title);
  console.log('Generated Nodes count:', mindMapResult.nodes.length);
  console.log('Generated Edges count:', mindMapResult.edges.length);

  if (!mindMapResult.nodes || mindMapResult.nodes.length < 4) {
    throw new Error('Expected at least 4 nodes in mind map');
  }
  if (!mindMapResult.edges || mindMapResult.edges.length < 3) {
    throw new Error('Expected at least 3 edges connecting mind map nodes');
  }
  const rootNode = mindMapResult.nodes.find((n) => n.id === 'node_root');
  if (!rootNode) throw new Error('Expected central root node in mind map');
  console.log('Root node:', rootNode.text, 'at (', rootNode.x, ',', rootNode.y, ')');
  console.log('✓ Mind map generator verified.');

  // 3. Question Generator Service
  console.log('\n--- 3. Testing Question Generator Service ---');
  const studyText = `
Relational Database Management Systems (RDBMS) organize data into tables consisting of rows and columns.
Primary keys uniquely identify each record within a table, preventing duplicate entries.
Foreign keys establish referential integrity between related tables.
ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee that database transactions are processed reliably.
Normalization eliminates redundancy and prevents update anomalies.
  `;

  // Test 3a: MCQ
  const mcqQuestions = await generateQuestions({
    text: studyText,
    title: 'Database Systems Exam',
    count: 5,
    difficulty: 'medium',
    type: 'mcq',
  });
  console.log('MCQ count generated:', mcqQuestions.length);
  if (mcqQuestions.length !== 5) throw new Error(`Expected 5 MCQs, got ${mcqQuestions.length}`);
  if (!mcqQuestions[0].options || mcqQuestions[0].options.length < 2) {
    throw new Error('Expected options array in MCQ question');
  }
  console.log('Sample MCQ:', mcqQuestions[0].question);
  console.log('Sample Answer:', mcqQuestions[0].correctAnswer);

  // Test 3b: True/False
  const tfQuestions = await generateQuestions({
    text: studyText,
    count: 3,
    difficulty: 'easy',
    type: 'true_false',
  });
  console.log('True/False count generated:', tfQuestions.length);
  if (tfQuestions.length !== 3) throw new Error(`Expected 3 T/F questions, got ${tfQuestions.length}`);

  // Test 3c: Short Answer
  const saQuestions = await generateQuestions({
    text: studyText,
    count: 3,
    difficulty: 'hard',
    type: 'short_answer',
  });
  console.log('Short Answer count generated:', saQuestions.length);
  if (saQuestions.length !== 3) throw new Error(`Expected 3 Short Answer questions, got ${saQuestions.length}`);
  console.log('✓ Question generator service verified across multiple types and difficulties.');

  // 4. API Endpoints Testing
  console.log('\n--- 4. Testing Phase 6 API Routes ---');
  // Mind Map API
  const mapReq = new NextRequest('http://localhost:3000/api/mind-maps/generate', {
    method: 'POST',
    body: JSON.stringify({ text: sampleNotes, title: 'OS Architecture' }),
  });
  const mapRes = await postMindMap(mapReq);
  console.log('Mind Map API status:', mapRes.status);
  const mapJson = await mapRes.json();
  if (mapRes.status !== 200 || !mapJson.success || !mapJson.data) {
    throw new Error('Mind map API did not return success 200');
  }

  // Question API
  const qReq = new NextRequest('http://localhost:3000/api/questions/generate', {
    method: 'POST',
    body: JSON.stringify({ text: studyText, title: 'Databases Quiz', count: 5, difficulty: 'medium', type: 'mcq' }),
  });
  const qRes = await postQuestions(qReq);
  console.log('Questions API status:', qRes.status);
  const qJson = await qRes.json();
  if (qRes.status !== 200 || !qJson.success || !Array.isArray(qJson.questions)) {
    throw new Error('Questions API did not return success 200');
  }
  console.log('✓ Phase 6 API routes verified.');

  // 5. Storage & History Integration
  console.log('\n--- 5. Testing Storage & History Integration ---');
  const testMapId = `test_map_${Date.now()}`;
  await saveMindMapRecord({
    id: testMapId,
    userId: 'test_user_p6',
    title: 'Neural Networks Architecture',
    data: { ...mindMapResult, title: 'Neural Networks Architecture' },
  });
  const loadedMap = await getMindMapRecord(testMapId);
  console.log('Loaded Mind Map title:', loadedMap?.title, 'nodes:', loadedMap?.nodes?.length);
  if (!loadedMap || loadedMap.title !== 'Neural Networks Architecture') {
    throw new Error('Failed to load saved mind map from storage');
  }

  const testQSetId = `test_qset_${Date.now()}`;
  await saveQuestionSetRecord({
    id: testQSetId,
    userId: 'test_user_p6',
    title: 'Databases Midterm Set',
    data: {
      title: 'Databases Midterm Set',
      questions: mcqQuestions,
      difficulty: 'medium',
      questionCount: mcqQuestions.length,
      questionType: 'mcq',
    },
  });
  const loadedQSet = await getQuestionSetRecord(testQSetId);
  console.log('Loaded Question Set questions count:', loadedQSet?.questions?.length);
  if (!loadedQSet || loadedQSet.questions.length !== 5) {
    throw new Error('Failed to load saved question set from storage');
  }

  const historyItems = await getUnifiedHistory({ userId: 'test_user_p6' });
  console.log('Unified History items found for user:', historyItems.length);
  const foundMap = historyItems.find((i) => i.id === testMapId && i.toolType === 'mind_map');
  const foundQSet = historyItems.find((i) => i.id === testQSetId && i.toolType === 'question_set');
  if (!foundMap) throw new Error('Mind map not found in Unified History');
  if (!foundQSet) throw new Error('Question set not found in Unified History');
  console.log('✓ Mind maps and Question sets integrated into Unified History.');

  console.log('\n=== ALL PHASE 6 TESTS PASSED SUCCESSFULLY! ===\n');
}

runPhase6Tests().catch((err) => {
  console.error('Phase 6 Test Failure:', err);
  process.exit(1);
});
