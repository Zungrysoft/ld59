
import * as game from 'game'
import * as u from 'utils'
import { getIsTapeTranscribed, setTapeTranscribed } from './save.js';

const VALID_CHARS = "abcdefghijklmnopqrstuvwxyz1234567890 ";

function stripString(rawText) {
  let text = "";
  for (let i = 0; i < rawText.length; i ++) {
    const char = rawText[i].toLowerCase();
    if ((VALID_CHARS).includes(char)) {
      text = text + char;
    }
  }
  return text.trim();
}

export function checkTranscription(tapeId, rawText) {
  const text = stripString(rawText);

  let bestTranscription = null;
  let bestCorrectness = 0;
  const tape = game.assets.data.tapes[tapeId];
  for (let i = 0; i < tape.transcriptions.length; i ++) {
    const transcription = stripString(tape.transcriptions[i].text);

    const dist = wordLevenshtein(text, transcription);
    const correctness = 1 - u.clamp(dist / transcription.split(" ").length, 0, 1);

    if (correctness >= tape.transcriptions[i].requiredCorrectness && correctness > bestCorrectness) {
      bestCorrectness = correctness;
      bestTranscription = i;
    }
  }

  if (bestTranscription != null) {
    // First, save to localstorage
    const wasAlreadyTranscribed = getIsTapeTranscribed(tapeId, bestTranscription);

    if (wasAlreadyTranscribed) {
      return ["This speech has already been transcribed.", false];
    }

    setTapeTranscribed(tapeId, bestTranscription);

    const accuracy = (bestCorrectness * 100).toFixed(1);
    return [`Successfully transcribed conversation with ${accuracy}% accuracy!`, true];
  }

  return ["This transcription is not sufficiently complete.", false];
  
}

function wordLevenshtein(a, b) {
  const wordsA = a.split(" ").filter(x => x !== "");;
  const wordsB = b.split(" ").filter(x => x !== "");

  // Always use the shorter array for the DP row to save memory.
  let source = wordsA;
  let target = wordsB;

  if (target.length > source.length) {
    [source, target] = [target, source];
  }

  const n = target.length;

  // previous[j] = distance between source[0..i-1] and target[0..j-1]
  let previous = new Array(n + 1);
  let current = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    previous[j] = j;
  }

  for (let i = 1; i <= source.length; i++) {
    current[0] = i;
    const sourceWord = source[i - 1];

    for (let j = 1; j <= n; j++) {
      const targetWord = target[j - 1];
      const cost = isSameWord(sourceWord, targetWord) ? 0 : 1;

      const deletion = previous[j] + 1;
      const insertion = current[j - 1] + 1;
      const substitution = previous[j - 1] + cost;

      current[j] = Math.min(deletion, insertion, substitution);
    }

    [previous, current] = [current, previous];
  }

  return previous[n];
}

function isSameWord(a, b) {
  return a === b;
}
