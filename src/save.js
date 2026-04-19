
import * as game from 'game'
import * as u from 'utils'

let saveData = null;

function checkLoad() {
  if (saveData == null) {
    saveData = JSON.parse(localStorage.getItem('cutThroughSave'));
    if (!saveData) {
      saveData = {
        version: 1,
        transcribedKeys: [],
      }
    }
  }
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
