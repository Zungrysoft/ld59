import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { drawBackground } from './draw.js'
import Desk from './desk.js'
import TapeDrawer from './tapedrawer.js'

export default class TitleScreen extends Thing {
  page = 0

  constructor() {
    super();
  }

  update() {
    if (game.mouse.leftClick) {
      this.page ++;

      soundmanager.playSound('clack', 1.0, 0.4)

      if (this.page > 1) {
        this.isDead = true;
        game.addThing(new Desk());
        game.addThing(new TapeDrawer());
      }
    }
  }

  draw() {
    drawBackground({
      depth: 2,
      sprite: game.assets.textures[this.page === 0 ? 'titlescreen' : 'helpscreen']
    })
  }
}
