import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import prisma from '../config/db.js';

export const processDocument = async (documentId: string) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    // Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // 2. Read file
    console.log(`📂 Reading file at ${document.filePath}...`);
    const fileBuffer = await fs.readFile(document.filePath);
    let text = '';

    if (document.fileType.includes('pdf')) {
      console.log(`📄 Parsing PDF via PDFParse class...`);
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else {
      console.log(`📝 Reading text file...`);
      text = fileBuffer.toString('utf-8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in document');
    }

    console.log(`✂️ Chunking text (${text.length} characters)...`);
    // 3. Chunk text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(text);

    // 4. Save chunks to DB
    console.log(`💾 Saving ${chunks.length} chunks to database...`);
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    const chunkData = chunks.map((content: string, index: number) => ({
      content,
      index,
      documentId,
    }));

    await prisma.documentChunk.createMany({
      data: chunkData,
    });

    // 5. Generate and store embeddings (Placeholder for now)
    // In a real app, we would send these to OpenAI and store in pgvector/Pinecone
    // For now, we update status to COMPLETED
    await prisma.document.update({
      where: { id: documentId },
      data: { 
        status: 'COMPLETED',
        content: text.substring(0, 5000), // Store preview if needed
      },
    });

    console.log(`✅ Document ${document.title} processed successfully. ${chunks.length} chunks created.`);
  } catch (error: any) {
    console.error(`❌ Error processing document ${documentId}:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { 
        status: 'FAILED',
      },
    }).catch(e => console.error("Failed to update status to FAILED:", e));
  }
};

export const reprocessPendingDocuments = async () => {
  try {
    const pendingDocs = await prisma.document.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingDocs.length > 0) {
      console.log(`🔄 Startup: Found ${pendingDocs.length} pending/interrupted documents. Reprocessing...`);
      for (const doc of pendingDocs) {
        processDocument(doc.id); // Run in background
      }
    }
  } catch (error) {
    console.error("Failed to re-process pending documents on startup:", error);
  }
};
