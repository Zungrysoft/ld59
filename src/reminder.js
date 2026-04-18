import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Tray from './tray.js'
import { drawBackground, drawSprite, drawText, getTextHeight, getTextWidth } from './draw.js'
import Button from './button.js'
import Furniture from './furniture.js'
import Thing from 'thing'
import { TEXT_HIGHLIGHTED, TEXT_REGULAR, TEXT_SELECTED, TEXT_TITLE } from './quiz.js'

export default class Reminder extends Thing {
  time = 0
  position = [0, 0]
  depth = 2000

  constructor(text, isDark) {
    super()
    this.text = text
    this.middlePos = vec2.add([1280/2, 720/2], [getTextWidth(text) * -0.5, getTextHeight(text) * -0.5])
    this.position = [-400, this.middlePos[1]]
    this.endPos = [1280 + 400, this.middlePos[1]]
    this.isDark = isDark
  }

  update() {
    this.time ++

    if (this.time < 6 * 60) {
      this.position = vec2.lerp(this.position, this.middlePos, 0.04)
    }
    else {
      this.position = vec2.lerp(this.position, this.endPos, 0.04)
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
      color: this.isDark ? TEXT_HIGHLIGHTED : TEXT_SELECTED,
    })
    drawText({
      text: this.text,
      position: vec2.add(this.position, [2, 2]),
      depth: this.depth - 1,
      color: this.isDark ? TEXT_TITLE : TEXT_REGULAR,
    })
  }
}
