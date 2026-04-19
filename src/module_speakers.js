import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'

export default class ModuleSpeakers extends Module {
  width = 32
  height = 30
  sprite = 'module_speakers'
  outputHeight = null
  parameters = {
    input: {
      inputHeight: 24,
      isSignal: true,
    },
  }
  immoveable = true

  constructor(nodeId, position) {
    super(nodeId, position);
    game.setThingName(this, 'speakers')

    this.init();
  }
}
