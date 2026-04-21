import * as fs from 'node:fs';
import * as path from 'node:path';

export function writeJsonFile(targetPath: string, data: unknown) {
  const dirPath = path.dirname(targetPath);
  fs.mkdirSync(dirPath, { recursive: true });

  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, targetPath);
}
