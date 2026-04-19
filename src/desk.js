import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Clickable from './clickable.js'
import { HIGHLIGHT_YELLOW } from './colors.js'

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

    if (game.keysPressed.KeyJ) {
      
    }
  }

  isChildClickable(key) {
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

  draw() {
    drawBackground({
      color: [0, 0, 0],
      depth: 1,
    })

    drawSprite({
      sprite: game.assets.textures[this.isTrayOpen ? 'transcribe_close' : 'transcribe'],
      position: [0, 0],
      width: 32,
      height: 32,
      color: this.clickables['transcribe'].isHighlighted ? HIGHLIGHT_YELLOW : [1, 1, 1],
    })
  }
}
