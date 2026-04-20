import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Clickable from './clickable.js'
import { HIGHLIGHT_YELLOW } from './colors.js'
import { deleteSaveData } from './save.js'

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
  }

  update() {
    this.time++

    // this.clickables['transcribe'].aabb = this.getButtonAabb();

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
  }
}
