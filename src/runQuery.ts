import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import logger from './logger';
import OpenAI from 'openai';

/**
 * Run a query on the Pinecone index and return the top 10 matches
 */
export const runQuery = async (
  client: Pinecone,
  indexName: string,
  question: string
) => {
  const index = client.Index(indexName);

  // Create query embedding
  logger.loading(`Embedding query: ${question}`);
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
  // Query pinecone index query and return matches
  let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true,
  });
  logger.loading(`Analyzing the data and forming a response`);
  if (queryResponse.matches.length > 0) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    logger.success('Response:');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `
          You are a bot designed to analyze the data and form a response.

          Context:
          ${queryResponse.matches
            .map(match => match.metadata.pageContent)
            .join(' ')}
          `,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      stream: true,
    });

    console.log('\n');
    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
  } else {
    // Log that there are no matches, GPT will not be queried
    logger.error('No matches found, ensure the index has been loaded');
  }
};
