
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

export function setTapeTranscribed(tape, conversation) {
  checkLoad();

  if (!getIsTapeTranscribed(tape, conversation)) {
    saveData.transcribedKeys.push(`${tape}-${conversation}`)
  }

  save();
}
