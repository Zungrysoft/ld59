import * as u from 'utils'

export const MIN_FREQ = 20;
export const MAX_FREQ = 20000;

export function normToFreq(n) {
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, n);
}

export function logFreq(f) {
  return Math.log10(f);
}

export function scaleSigma(width) {
  return u.map(width, 0, 1, 0.05, 0.8);
}
