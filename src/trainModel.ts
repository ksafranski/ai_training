import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { Document } from 'langchain/document';
import { EPubLoader } from 'langchain/document_loaders/fs/epub';
import { Index, Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import * as crypto from 'crypto';
import logger from './logger';
import { parseTrainingLog, writeTrainingLog } from './trainingLog';

/**
 * Generate a checksum to be used as the vector id
 */
const generateChecksum = (str: string): string =>
  crypto.createHash('md5').update(str, 'utf8').digest('hex');

/**
 * Load documents from a directory and return an array of Document objects
 * loaded by type
 */
const loadDirectory = async (
  path: string
): Promise<Document<Record<string, any>>[]> => {
  logger.loading(`Loading documents from ${path}`);
  const loader = new DirectoryLoader(path, {
    '.txt': path => new TextLoader(path),
    '.csv': path => new CSVLoader(path),
    '.json': path => new JSONLoader(path),
    '.epub': path => new EPubLoader(path),
  });
  const documents = await loader.load();
  return documents;
};

/**
 * Upsert vectors in the Pinecone index in batches of 100
 */
const upsertVectors = async (
  chunks: Document<Record<string, any>>[],
  index: Index<RecordMetadata>,
  embeddingsArrays: number[][],
  documentName: string
): Promise<void> => {
  try {
    const batchSize = 100;
    let batch = [];
    // Iterate over the chunks, generate id's from checksum and upseert the vectors
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      // Generate a checksum to prevent duplicate vectors
      const checksum = generateChecksum(chunk.pageContent);
      // Create the vector to be upserted
      const vector = {
        id: generateChecksum(checksum),
        values: embeddingsArrays[idx],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          documentName,
        },
      };
      batch.push(vector);
      // When batch is full or it's the last item, upsert the vectors
      if (batch.length === batchSize || idx === chunks.length - 1) {
        await index.upsert(batch);
        // Empty the batch
        batch = [];
      }
    }
  } catch (error) {
    logger.error(`Error upserting vectors: ${error.message}`);
  }
};

/**
 * Load data from a directory and upsert it into a Pinecone index
 * using the OpenAIEmbeddings class
 */
export const trainModel = async (
  client: Pinecone,
  indexName: string,
  path: string
) => {
  const documents = await loadDirectory(path);
  const trainingLog = await parseTrainingLog();
  // Process each document in the array from documents in the directory
  logger.loading(`Loading data into index: ${indexName}: 0%`);
  let count = 0;
  let docCount = documents.length;
  for (const document of documents) {
    // Build the document path, text and checksum
    const documentPath = document.metadata.source;
    const documentName = documentPath.split('/').pop();
    const documentText = document.pageContent;
    if (!documentText) continue;
    const documentChecksum = generateChecksum(documentText);
    // Check if document has already been trained
    if (trainingLog.includes(documentChecksum)) {
      docCount--;
      continue; // Move on to the next document
    }
    // Log progress
    count++;
    logger.replaceCurrentText(
      `[${documentName}]: Loading data into index: ${indexName}: ${
        count === docCount - 1 || docCount === 0
          ? '100'
          : Math.ceil((count / documents.length) * 100)
      }%`
    );
    // Create TextSplitter instance
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    // Split text into chunks
    const chunks = await textSplitter.createDocuments([documentText]);
    // Create OpenAI embeddings for documents
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map(chunk => chunk.pageContent.replace(/\n/g, ' '))
    );
    // Write to training log
    await writeTrainingLog(documentChecksum, documentName);
    // Get the pinecone index
    const index = client.Index(indexName);
    await upsertVectors(chunks, index, embeddingsArrays, documentName);
  }

  if (count === 0) {
    // Everything has already been loaded
    logger.warn(`No new data to load into index: ${indexName}`);
  } else {
    logger.success(`Available data loaded into index: ${indexName}`);
  }
};
