
import * as game from 'game'
import * as u from 'utils'

let saveData = null;



function generateHint(text, hintRate, hintRangeLength, hintRangeLengthRange) {
  if (hintRate === 0) {
    return "";
  }

  const words = text.split(" ");
  let ret = "";
  let i = 0;
  while (i < words.length) {
    const gapLength = Math.round(hintRangeLength + u.map(Math.random(), 0, 1, -hintRangeLengthRange, hintRangeLengthRange));
    const stringLengthMultiplier = (1 / hintRate) - 1;
    const stringLength = Math.round(stringLengthMultiplier * (hintRangeLength + u.map(Math.random(), 0, 1, -hintRangeLengthRange, hintRangeLengthRange)));
    
    for (let j = 0; j < stringLength; j ++) {
      if (i < words.length) {
        ret = ret + words[i] + " ";
      }
      i ++;
    }
    if (i < words.length) {
      i += gapLength;
      ret = ret + "- ";
    }
  }

  return ret.trim();
}

function generateHints() {
  let ret = {};
  for (const tapeId in game.assets.data.tapes) {
    const tape = game.assets.data.tapes[tapeId];
    let hints = [];
    for (let i = 0; i < tape.transcriptions.length; i ++) {
      const transcription = tape.transcriptions[i];

      const hint = transcription.hint || generateHint(transcription.text, transcription.hintRate, transcription.hintGapLength, transcription.hintGapLengthRange);

      hints.push(hint);
    }
    ret[tapeId] = hints;
  }
  return ret;
}

export function deleteSaveData() {
  localStorage.removeItem('cutThroughSave')
}

function checkLoad() {
  if (saveData == null) {
    saveData = JSON.parse(localStorage.getItem('cutThroughSave'));
    if (!saveData) {
      saveData = {
        version: 1,
        transcribedKeys: [],
        hints: generateHints(),
      }
    }
  }
}

export function getSavedHint(tapeId, transcription) {
  checkLoad();
  if (getIsTapeTranscribed(tapeId, transcription)) {
    return game.assets.data.tapes[tapeId].transcriptions[transcription].text;
  }
  return saveData.hints?.[tapeId]?.[transcription];
}

export function setSavedHint(tapeId, transcription, text) {
  checkLoad();
  if (saveData.hints?.[tapeId]?.[transcription] != null) {
    saveData.hints[tapeId][transcription] = text;
  }
  save();
}

function save() {
  localStorage.setItem('cutThroughSave', JSON.stringify(saveData));
}

export function getIsTapeTranscribed(tape, conversation) {
  checkLoad();
  const key = `${tape}-${conversation}`;
  return saveData.transcribedKeys.includes(key);
}

export function getTapeTranscribedCount(tape) {
  checkLoad();

  const total = game.assets.data.tapes[tape].transcriptions.length;
  let count = 0;
  for (let i = 0; i < total; i ++) {
    if (getIsTapeTranscribed(tape, i)) {
      count ++;
    }
  }
  return [count, total];
}

export function getTotalTranscribedCount() {
  checkLoad();

  let count = 0;
  let total = 0;
  for (const tape in game.assets.data.tapes) {
    const [countTape, totalTape] = getTapeTranscribedCount(tape);
    count += countTape;
    total += totalTape;
  }
  return [count, total];
}

export function setTapeTranscribed(tape, conversation) {
  checkLoad();

  if (!getIsTapeTranscribed(tape, conversation)) {
    saveData.transcribedKeys.push(`${tape}-${conversation}`)
  }

  save();
}
