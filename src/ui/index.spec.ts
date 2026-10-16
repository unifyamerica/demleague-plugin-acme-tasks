import { describe, expect, it } from 'vitest';
import ui from './index';

describe('the UI definition', () => {
  it('is valid for the manifest (define() throws otherwise)', () => {
    expect(ui.namespace).toBe('acme.tasks');
    expect(ui.routes.map((route) => route.name)).toEqual(['list']);
  });
});
