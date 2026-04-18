import { ChatGroq } from '@langchain/groq';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
// @ts-ignore
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document as LangchainDocument } from '@langchain/core/documents';
import prisma from '../config/db.js';

interface ResultDoc {
  pageContent: string;
  metadata: {
    title: string;
    documentId: string;
  };
}

const getModel = () => new ChatGroq({
  apiKey: process.env.GROQ_API_KEY || '',
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
});

const getEmbeddings = () => new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_TOKEN || '', // Use HF_TOKEN if available, otherwise empty (some models might work without it)
});

export const queryContext = async (query: string, workspaceId: string, documentIds?: string[]) => {
  // 1. Fetch chunks from DB
  console.log(`  - Fetching chunks for workspace ${workspaceId}...`);
  const chunks = await prisma.documentChunk.findMany({
    where: {
      document: {
        workspaceId,
        ...(documentIds && documentIds.length > 0 ? { id: { in: documentIds } } : {}),
      },
    },
    include: { document: true },
  });

  console.log(`  - Found ${chunks.length} chunks.`);
  if (chunks.length === 0) {
    return { answer: "No processed documents found in this workspace. Please upload and wait for processing to complete. (If you just uploaded, wait a few seconds and try again)", context: [] };
  }

  // 2. Load into in-memory vector store
  console.log(`  - Creating vector store from ${chunks.length} chunks...`);
  const langchainDocs = chunks.map((c: { content: any; documentId: any; document: { title: any; }; }) => new LangchainDocument({
    pageContent: c.content,
    metadata: { documentId: c.documentId, title: c.document.title },
  }));

  try {
    const embeddings = getEmbeddings();
    console.log(`  - Generating embeddings... (This may hang if HF_TOKEN is missing or API is slow)`);
    
    // Create a timeout promise
    let vectorStore;
    try {
      // Set a 10s timeout for embeddings
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Embedding Timeout")), 10000));
      vectorStore = await Promise.race([
        MemoryVectorStore.fromDocuments(langchainDocs, embeddings),
        timeoutPromise
      ]) as MemoryVectorStore;
    } catch (e: any) {
      console.warn(`  - ⚠️ Embedding search failed (${e.message}). Falling back to simple retrieval...`);
      // FALLBACK: Just take the first 5 chunks as context
      const fallbackContext = chunks.slice(0, 5).map((c: { content: any; }) => c.content).join('\n\n');
      const fallbackDocs = chunks.slice(0, 5).map((c: { content: any; document: { title: any; }; }) => ({
        content: c.content,
        source: c.document.title,
      }));
      
      return await generateAnswerWithContext(query, fallbackContext, fallbackDocs, true);
    }

    // 3. Search for relevant context
    console.log(`  - Searching for context relevant to: "${query}"...`);
    const relevantDocs = await vectorStore.similaritySearch(query, 4);
    const context = relevantDocs.map((d: any) => d.pageContent).join('\n\n');
    const sources = relevantDocs.map((d: any) => ({
      content: d.pageContent,
      source: d.metadata.title,
    }));

    return await generateAnswerWithContext(query, context, sources, false);
  } catch (e: any) {
    console.error("  - Vector store/LLM Error:", e.message);
    throw e;
  }
};

/**
 * Helper to generate response from LLM given context
 */
async function generateAnswerWithContext(query: string, context: string, sources: any[], isFallback: boolean) {
  console.log(`  - Invoking Groq LLM... (${isFallback ? 'Fallback Mode' : 'Vector Mode'})`);
  const model = getModel();
  const prompt = `
    You are an AI study assistant. Answer the user's question based ONLY on the provided context from their study materials.
    If the answer is not in the context, say that you don't know based on the documents.
    
    Context:
    ${context}
    
    Question: ${query}
  `;

  const response = await model.invoke(prompt);
  let answer = response.content.toString();

  if (isFallback) {
    answer += "\n\n*(Note: Running in basic search mode. Add HF_TOKEN to .env for smarter results)*";
  }

  console.log(`  - LLM Response received.`);
  return { answer, context: sources };
}

export const generateStudyQuiz = async (workspaceId: string, documentIds?: string[], numQuestions: number = 5) => {
  // 1. Fetch random chunks for varied source material
  const chunks = await prisma.documentChunk.findMany({
    where: {
      document: {
        workspaceId,
        ...(documentIds && documentIds.length > 0 ? { id: { in: documentIds } } : {}),
      },
    },
    take: 20, // Limit context for quiz generation
  });

  if (chunks.length === 0) {
    throw new Error("No study material found to generate a quiz.");
  }

  const context = chunks.map((c: { content: any; }) => c.content).join('\n\n');

  // 2. Generate Quiz using LLM
  const model = getModel();
  const prompt = `
    Generate a multiple choice quiz with ${numQuestions} questions based on the following study material.
    Return ONLY a JSON array of objects with the following structure:
    [
      {
        "text": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A"
      }
    ]
    
    Material:
    ${context}
  `;

  const response = await model.invoke(prompt);
  
  // Clean up response if needed (sometimes LLMs add markdown blocks or conversational text)
  let quizData = response.content.toString();
  
  // Attempt to find the first '[' and last ']' to extract just the JSON array
  const firstBracket = quizData.indexOf('[');
  const lastBracket = quizData.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1) {
    quizData = quizData.substring(firstBracket, lastBracket + 1);
  }

  try {
    const parsed = JSON.parse(quizData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse quiz JSON:", quizData);
    return [];
  }
};

export const explainConcept = async (topic: string, workspaceId: string, documentIds?: string[]) => {
  // 1. Fetch relevant context
  const { context } = await queryContext(`Explain ${topic}`, workspaceId, documentIds);
  
  const model = getModel();
  const prompt = `
    You are an expert tutor. Explain the following concept clearly and simply using the provided context from study materials.
    Break it down into easy to understand metaphors and key points.
    
    Topic: ${topic}
    
    Context:
    ${context}
  `;

  const response = await model.invoke(prompt);
  return { explanation: response.content };
};
