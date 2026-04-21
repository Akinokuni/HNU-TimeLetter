import * as path from 'node:path';
import defaultLocations from '../../../config/locations.json';
import type { LocationCoords } from '../types';
import { readJsonFile } from '../shared/files';
import { writeJsonFile } from './json-writer';

export const LOCATIONS_FILE_PATH = 'src/config/locations.json';

const locationsFile = path.resolve(process.cwd(), LOCATIONS_FILE_PATH);
const defaultLocationCoords = defaultLocations as LocationCoords;

export function readLocationConfig() {
  return readJsonFile<LocationCoords>(locationsFile, defaultLocationCoords);
}

export function writeLocationConfig(data: LocationCoords) {
  writeJsonFile(locationsFile, data);
  return LOCATIONS_FILE_PATH;
}
