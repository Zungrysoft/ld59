import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'

export default class Module extends Thing {
  depth = 10
  width = 100
  height = 100
  moveable = true
  sprite = 'square'
  outputHeight = 10
  
  constructor(position = [100, 100], parameters) {
    super();

    this.position = position;

    this.parameters = parameters;
    this.parameterValues = {};
    for (const paramKey in this.parameters) {
      const param = this.parameters[paramKey];

      const typeDefault = param.isBoolean ? false : 0.5;
      this.parameterValues[paramKey] = param.defaultValue ?? typeDefault;
    }
  }

  update() {
    this.time++

    // Rebuild audio graph

    // System
  }

  draw() {
    drawSprite({
      sprite: game.assets.textures[this.sprite],
      position: this.position,
      width: this.width,
      height: this.height,
      depth: this.depth,
    })
  }
}
