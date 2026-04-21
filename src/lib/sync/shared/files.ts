import * as fs from 'node:fs';

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}
