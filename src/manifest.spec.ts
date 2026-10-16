import { validateManifest } from '@unifyamerica/demleague-plugin-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ACME_TASKS_MANIFEST } from './manifest';

describe('ACME_TASKS_MANIFEST', () => {
  it('should be valid', () => {
    expect(validateManifest(ACME_TASKS_MANIFEST)).toEqual([]);
  });

  it('should match the package version', () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf8'),
    ) as { version: string };
    expect(ACME_TASKS_MANIFEST.version).toBe(packageJson.version);
  });
});
