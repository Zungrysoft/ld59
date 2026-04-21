import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Clickable from './clickable.js'
import { HIGHLIGHT_YELLOW } from './colors.js'
import { deleteSaveData, getTotalTranscribedCount } from './save.js'
import ModuleTapedeck from './module_tapedeck.js'
import ModuleSpeakers from './module_speakers.js'
import ModuleOscillator from './module_oscillator.js'
import ModuleHighpass from './module_highpass.js'
import ModuleLowpass from './module_lowpass.js'
import ModuleEQ from './module_eq.js'
import Module from './module.js'
import Reminder from './reminder.js'

const modules = [
  {
    "type": "tapedeck",
    "nodeId": "audio1",
    "position": [30, 50],
    "pointsToUnlock": 0
  },
  {
    "type": "speakers",
    "nodeId": "speaker",
    "position": [480 - 32 - 2, 2],
    "pointsToUnlock": 0
  },
  {
    "type": "eq",
    "nodeId": "eq1",
    "position": [200, 220],
    "pointsToUnlock": 5
  },
  {
    "type": "lowpass",
    "nodeId": "eq2",
    "position": [171, 70],
    "pointsToUnlock": 2
  },
  {
    "type": "highpass",
    "nodeId": "eq3",
    "position": [330, 140],
    "pointsToUnlock": 1
  },
  {
    "type": "oscillator",
    "nodeId": "sine1",
    "position": [20, 270],
    "pointsToUnlock": 10
  },
];

export default class Desk extends Thing {
  time = 0
  isTrayOpen = false
  clickables = {}

  constructor() {
    super();

    const clickableAabb = [
      0,
      0,
      24,
      24,
    ];
    this.clickables['transcribe'] = game.addThing(new Clickable(this, 'transcribe', clickableAabb));

    const [totalTranscribed, _] = getTotalTranscribedCount();
    this.totalTranscribed = totalTranscribed;

    this.spawnModules(false);
  }

  spawnModules(offScreen) {
    const spawnedIds = new Set();
    for (const module of game.getThings().filter(x => x instanceof Module)) {
      spawnedIds.add(module.nodeId);
    }
    for (const config of modules) {
      if (!spawnedIds.has(config.nodeId) /*&& this.totalTranscribed >= config.pointsToUnlock*/) {
        this.spawnModule(config, offScreen);
      }
    }
  }

  spawnModule(config, offScreen) {
    const makePos = (pos) => {
      if (offScreen) {
        return [
          game.getWidth() + 10,
          pos[1],
        ]
      }
      return pos;
    }

    if (config.type === 'tapedeck') {
      game.addThing(new ModuleTapedeck(config.nodeId, makePos(config.position)));
    }
    else if (config.type === 'speakers') {
      game.addThing(new ModuleSpeakers(config.nodeId, makePos(config.position)));
    }
    else if (config.type === 'eq') {
      game.addThing(new ModuleEQ(config.nodeId, makePos(config.position)));
    }
    else if (config.type === 'lowpass') {
      game.addThing(new ModuleLowpass(config.nodeId, makePos(config.position)));
    }
    else if (config.type === 'highpass') {
      game.addThing(new ModuleHighpass(config.nodeId, makePos(config.position)));
    }
    else if (config.type === 'oscillator') {
      game.addThing(new ModuleOscillator(config.nodeId, makePos(config.position)));
    }
  }

  update() {
    this.time++

    // this.clickables['transcribe'].aabb = this.getButtonAabb();

    const [totalTranscribed, _] = getTotalTranscribedCount();
    if (totalTranscribed > this.totalTranscribed) {
      this.totalTranscribed = totalTranscribed;
      this.spawnModules(true);

      for (const tapeId in game.assets.data.tapes) {
        if (game.assets.data.tapes[tapeId].pointsToUnlock === this.totalTranscribed) {
          game.addThing(new Reminder("New tapes unlocked!", [1, 1, 1], [0.3, 0.3, 0.3], 40));
        }
      }
    }
    

    if (game.keysPressed.KeyP && game.keysDown.ShiftLeft) {
      deleteSaveData();
    }
  }

  isChildClickable(key) {
    if (game.getThing('tapeDrawer').isOpen) {
      return false;
    }
    
    return true;
  }

  onClickChild(key) {
    if (key === 'transcribe') {
      this.isTrayOpen = !this.isTrayOpen;
      const tray = document.getElementById("tray");
      if (tray) {
        if (this.isTrayOpen) {
          tray.open();
        }
        else {
          tray.close();
        }
      }
    }
  }

  // getButtonAabb() {
  //   return [
  //     0,
  //     Math.max(game.getThing('tapeDrawer').position[1] + 144, 0),
  //     24,
  //     Math.max(game.getThing('tapeDrawer').position[1] + 144, 0) + 24
  //   ]
  // }

  draw() {
    drawBackground({
      color: [0, 0, 0],
      depth: 1,
    })

    drawSprite({
      sprite: game.assets.textures[this.isTrayOpen ? 'transcribe_close' : 'transcribe'],
      // position: this.getButtonAabb(),
      position: [0, 0],
      width: 32,
      height: 32,
      color: this.clickables['transcribe'].isHighlighted ? HIGHLIGHT_YELLOW : [1, 1, 1],
      depth: 50,
    })

    if (this.totalTranscribed === 0) {
      drawText({
        color: [0.3, 0.3, 0.3],
        scale: 2,
        depth: 2,
        text: "1: Load tape into tapedeck\n2: Connect tapedeck to speakers\n3: Press play",
        position: [30, 240],
      })
    }
  }
}
