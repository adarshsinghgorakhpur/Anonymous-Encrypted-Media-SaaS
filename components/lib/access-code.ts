const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;

export function generateAccessCode(): string {
  const array = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[array[i] % CHARSET.length];
  }
  return code;
}

export function formatAccessCode(code: string): string {
  return code;
}
