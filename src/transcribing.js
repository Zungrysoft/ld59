
import * as game from 'game'
import * as u from 'utils'
import { getIsTapeTranscribed, setTapeTranscribed } from './save.js';

const THRESHOLD = 0.7;
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

export function checkTranscription(rawText) {
  const text = stripString(rawText);

  let bestTape = null;
  let bestTranscription = null;
  let bestCorrectness = 0;
  for (const tapeId in game.assets.data.tapes) {
    const tape = game.assets.data.tapes[tapeId];
    for (let i = 0; i < tape.transcriptions.length; i ++) {
      const transcription = stripString(tape.transcriptions[i]);

      const dist = wordLevenshtein(text, transcription);
      const correctness = 1 - u.clamp(dist / transcription.split(" ").length, 0, 1);

      if (correctness >= THRESHOLD && correctness > bestCorrectness) {
        bestCorrectness = correctness;
        bestTape = tapeId;
        bestTranscription = i;
      }
    }
  }

  if (bestTape) {
    // First, save to localstorage
    const wasAlreadyTranscribed = getIsTapeTranscribed(bestTape, bestTranscription);

    if (wasAlreadyTranscribed) {
      return ["This speech has already been transcribed.", false];
    }

    setTapeTranscribed(bestTape, bestTranscription);

    const tapeTitle = game.assets.data.tapes[bestTape].title;
    const accuracy = (bestCorrectness * 100).toFixed(1);
    return [`Successfully transcribed conversation from \"${tapeTitle}\" with ${accuracy}% accuracy!`, true];
  }

  return ["This transcription does not sufficiently match any tapes.", false];
  
}

function wordLevenshtein(a, b) {
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");

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
