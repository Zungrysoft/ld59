
import * as game from 'game'
import * as u from 'utils'

let saveData = null;
// let selectedTranscription = 0;

export function deleteSaveData() {
  localStorage.removeItem('cutThroughSave')
}

function generateHints() {
  let ret = {};
  for (const tapeId in game.assets.data.tapes) {
    const tape = game.assets.data.tapes[tapeId];
    let hints = [];
    for (let i = 0; i < tape.transcriptions.length; i ++) {
      hints.push("HINT FOR " + i)
    }
    ret[tapeId] = hints;
  }
  return ret;
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
  if (getIsTapeTranscribed(tapeId, transcription)) {
    return game.assets.data.tapes[tapeId].transcriptions[transcription].text;
  }
  return saveData.hints?.[tapeId]?.[transcription];
}

export function setSavedHint(tapeId, transcription, text) {
  if (saveData.hints?.[tapeId]?.[transcription] != null) {
    saveData.hints[tapeId][transcription] = text;
  }
  save();
}

// function setSelectedTranscriptionSave(i) {
//   selectedTranscription = i;
//   const tray = document.getElementById("tray");
//   if (tray) {
//     tray.setSelectedTranscription
//   }
// }

function save() {
  localStorage.setItem('cutThroughSave', JSON.stringify(saveData));
}

export function getIsTapeTranscribed(tape, conversation) {
  checkLoad();
  const key = `${tape}-${conversation}`;
  return saveData.transcribedKeys.includes(key);
}

export function getTapeTranscribedCount(tape) {
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
