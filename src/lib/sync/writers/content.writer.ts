import * as path from 'node:path';
import type { LocationPoint } from '../../types';
import { writeJsonFile } from './json-writer';

export const CONTENT_FILE_PATH = 'src/data/content.json';

const contentFile = path.resolve(process.cwd(), CONTENT_FILE_PATH);

export function writeContent(locations: LocationPoint[]) {
  writeJsonFile(contentFile, { locations });
  return CONTENT_FILE_PATH;
}
