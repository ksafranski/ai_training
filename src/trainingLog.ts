import * as fs from 'fs/promises';
import path = require('path');
import logger from './logger';

// Line delimited <checksum>|<name>|<timestamp>
const TRAINING_LOG = path.resolve(__dirname, '../trainings.log');

type Checksum = string;

/**
 * Load training log and parse
 */
export const parseTrainingLog = async (): Promise<Checksum[]> => {
  try {
    const log = await fs.readFile(TRAINING_LOG, 'utf8');
    return log.split('\n').reduce((acc, line) => {
      acc.push(line.split('|')[0]); // checksum
      return acc;
    }, []);
  } catch (error) {
    // No logs, will create on write
    return [];
  }
};

/**
 * Write to training log
 */
export const writeTrainingLog = async (
  checksum: Checksum,
  name: string
): Promise<void> => {
  try {
    await fs.appendFile(TRAINING_LOG, `${checksum}|${Date.now()}|${name}\n`, {
      flag: 'a+',
      encoding: 'utf8',
    });
  } catch (error) {
    logger.error(`Error writing to training log: ${error.message}`);
  }
};
