import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Tray from './tray.js'
import { drawBackground, drawSprite } from './draw.js'

export default class Button extends Tray {

  constructor(trayName, openSprite, closedSprite, size, openPosition, closedPosition, defaultOpen, toggleButtonAABB) {
    super(trayName, openSprite, closedSprite, size, openPosition, closedPosition, defaultOpen, toggleButtonAABB)
  }


  onClick() {
    if (!this.isTransitioningClosed && !this.isTransitioningOpen) this.toggleOpenState();
  }

  isClickable() {
    if (game.getThing('quiz')?.isEnabled) return false
    if (game.getThing('house')?.gamePhase == 'party') return false
    if (this.isTransitioningClosed || this.isTransitioningOpen) return false
    return true
  }

  update() {
    super.update()

  }

  draw() {
    const color = this.isHighlighted ? [1.3, 1.3, 1.3] : [1.0, 1.0, 1.0]

    drawSprite({
      sprite: this.sprite,
      color: color,
      width: this.size[0],
      height: this.size[1],
      depth: this.depth,
      position: this.position,
      alpha: this.isClickable() ? 1.0 : 0.5,
    
    })
  }
}
