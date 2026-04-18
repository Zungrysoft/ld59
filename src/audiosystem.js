import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'

export default class AudioSystem extends Thing {
  time = 0

  constructor() {
    super();
  }

  update() {
    this.time++

    // Rebuild audio graph

    // System
  }

  draw() {
    drawBackground({
      color: [0, 0, 0],
      depth: 1,
    })
  }
}
