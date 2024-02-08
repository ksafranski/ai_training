import {
  IndexModel,
  Pinecone,
  CreateIndexRequestMetricEnum,
} from '@pinecone-database/pinecone';
import { CreateIndexRequestSpec } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import logger from './logger';

/**
 * Gets index list from client, checks if index exists
 */
export const indexExists = async (
  client: Pinecone,
  indexName: string
): Promise<IndexModel | false> => {
  const { indexes } = await client.listIndexes();
  return indexes && indexes.find((i: IndexModel) => i.name === indexName);
};

/**
 * Ensures an index exists, creating it if it doesn't
 */
export const ensureIndex = async (
  client: Pinecone,
  indexName: string,
  spec: CreateIndexRequestSpec,
  vectorDimensions: number = 1536,
  metric: CreateIndexRequestMetricEnum = 'cosine'
): Promise<void> => {
  logger.loading(`Ensuring index`, indexName);
  // Check if index exists, return if it does
  const existingIndex = await indexExists(client, indexName);
  if (existingIndex) {
    logger.success(
      `Index exists: ${existingIndex.name}, status: ${existingIndex.status.state}`
    );
    return;
  }
  // Index doesn't exist, create it
  logger.loading('Index does not exist, creating...');
  // Call createIndex on the client with the index name, dimensions, and metric
  const createdIndex = await client.createIndex({
    name: indexName,
    dimension: vectorDimensions,
    metric,
    spec,
    waitUntilReady: true,
  });
  if (createdIndex) {
    logger.success(
      `Index created: ${createdIndex.name}, status: ${createdIndex.status.state}`
    );
  } else {
    logger.error('Index creation failed');
  }
};
