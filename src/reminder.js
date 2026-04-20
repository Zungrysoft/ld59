import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import { drawBackground, drawSprite, drawText, getTextHeight, getTextWidth } from './draw.js'
import Thing from 'thing'

export default class Reminder extends Thing {
  time = 0
  position = [0, 0]
  depth = 2000

  constructor(text, color1, color2, delay) {
    super()
    this.text = text
    this.middlePos = vec2.add([game.getWidth()/2, game.getHeight()/2], [getTextWidth(text) * -0.5 * 2, getTextHeight(text) * -0.5 * 2])
    this.position = [-400, this.middlePos[1]]
    this.endPos = [game.getHeight() + 400, this.middlePos[1]]
    this.color1 = color1
    this.color2 = color2
    this.time = -delay;
  }

  update() {
    this.time ++

    if (this.time < 0) {
      // no-op
    }
    else if (this.time < 6 * 60) {
      this.position = vec2.lerp(this.position, this.middlePos, 0.03)
    }
    else {
      this.position = vec2.lerp(this.position, this.endPos, 0.03)
      if (this.time > 12 * 60) {
        this.isDead = true
      }
    }
  }

  draw() {
    drawText({
      text: this.text,
      position: this.position,
      depth: this.depth,
      color: this.color1,
      scale: 2,
    })
    drawText({
      text: this.text,
      position: vec2.add(this.position, [2, 2]),
      depth: this.depth - 1,
      color: this.color2,
      scale: 2,
    })
  }
}
