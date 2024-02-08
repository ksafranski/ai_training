import { Pinecone } from '@pinecone-database/pinecone';
import { PodSpecFromJSON } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import { argv } from 'process';

import { ensureIndex } from './ensureIndex';
import { trainModel } from './trainModel';
import { runQuery } from './runQuery';

/**
 * Define name and spec for Pinecone index
 */
const INDEX_NAME = 'test-llm-index';
const INDEX_SPEC = {
  pod: PodSpecFromJSON({
    pod_type: 'p1',
    environment: 'gcp-starter',
  }),
};

/**
 * Create Pinecone client
 */
const client = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

/**
 * Processes command line arguments and runs the appropriate function:
 * `train <path>` - Load data from a directory
 * `prompt <question>` - Run a query on the Pinecone index
 */
const main = async () => {
  // Determine command and argument
  const [command, argument] = [argv[argv.length - 2], argv[argv.length - 1]];
  console.log('\n'); // Just for readability of log output
  await ensureIndex(client, INDEX_NAME, INDEX_SPEC);
  // Load data to train model
  if (command === 'train') {
    await trainModel(client, INDEX_NAME, argument);
  }
  // Run query from prompt
  if (command === 'prompt') {
    await runQuery(client, INDEX_NAME, argument);
  }
  console.log('\n');
};

main();
