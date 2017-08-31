import { DocTarget } from './doc';

export function validate<T = any>(val: T, ...validators: Validator[]): T {
  if (typeof val === 'undefined') return val;
  for (const vld of (validators || [])) vld(val);
  return val;
}

export interface Validator { (value: any): void|Promise<void> }

export const Validators = {
  boolean(val: boolean) {
    if (typeof val !== 'boolean') throw new Error('Not a boolean');
  },
  float(val: number) {
    Validators.number(val);
    if (val < Math.pow(-2, 63) || val > Math.pow(-2, 63) - 1)
      throw new Error('Exceed 64-bit range');
  },
  int(val: number) {
    Validators.number(val);
    if (val !== Math.floor(val)) throw new Error('Not a integer');
    if (val < Math.pow(-2, 31) || val > Math.pow(-2, 31) - 1)
      throw new Error('Exceed 32-bit range');
  },
  number(val: number) {
    if (typeof val !== 'number') throw new Error('Not a number');
  },
  shortid(val: string) {
    Validators.string(val);
    if (!/^[\w-]{7,14}$/.test(val)) throw new Error('Not a shortid');
  },
  string(val: string) {
    if (typeof val !== 'string') throw new Error('Not a string');
  },
};

