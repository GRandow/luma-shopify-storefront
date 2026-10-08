import { describe, expect, it } from 'vitest';
import { isEmailAddress } from '@/utils/email';

describe('isEmailAddress', () => {
  it.each(['ana@example.com', 'ana.souza+news@mail.example.co'])('accepts %s', (value) => {
    expect(isEmailAddress(value)).toBe(true);
  });

  it.each([
    '',
    'ana',
    'ana@',
    '@example.com',
    'ana@example',
    'ana @example.com',
    'ana@example..com',
  ])('rejects "%s"', (value) => {
    expect(isEmailAddress(value)).toBe(false);
  });
});
