import * as u from 'utils'

export const MIN_FREQ = 20;
export const MAX_FREQ = 20000;

export function normToFreq(n) {
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, n);
}

export const MIN_FREQ2 = 0.3;
export const MAX_FREQ2 = 5;

export function normToFreq2(n) {
  return MIN_FREQ2 * Math.pow(MAX_FREQ2 / MIN_FREQ2, n);
}

export function normToFreq3(n, min, max) {
  return min * Math.pow(max / min, n);
}

export function logFreq(f) {
  return Math.log10(f);
}

export function scaleSigma(width) {
  return u.map(width, 0, 1, 0.05, 0.8);
}
