import * as game from 'game'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Selector from './selector.js'
import ModuleEQ from './module_eq.js'
import AudioSystem from './audiosystem.js'

document.title = 'Cut Through'
game.setWidth(360)
game.setHeight(240)
game.createCanvases();
const { ctx } = game
ctx.save()
ctx.fillStyle = 'white'
ctx.font = 'italic bold 64px Arial'
ctx.fillText('Loading audio...', 64, game.getHeight() - 128)
ctx.font = 'italic bold 48px Arial'
ctx.fillText('(this may take a minute or so)', 64, game.getHeight() - 64)
ctx.restore()

let fontData = {};
for (const char of "abcdefghijklmnopqrstuvwxyz") {
  fontData["letter_lower_" + char] = 'images/font/letter_lower_' + char + '.png';
  fontData["letter_upper_" + char] = 'images/font/letter_upper_' + char + '.png';
}
for (const symbol of ['comma', 'period', 'exclamation_point', 'question_mark', 'colon', 'apostraphe']) {
  fontData["letter_symbol_" + symbol] = 'images/font/letter_symbol_' + symbol + '.png';
}
for (let i = 0; i < 10; i ++) {
  fontData["letter_number_" + i.toString()] = 'images/font/letter_number_' + i.toString() + '.png';
}

game.assets.images = await game.loadImages({
  square: 'images/square.png',

  module_eq: 'images/module/eq.png',



  ...fontData,
})

game.assets.data = await game.loadJson({
  tapes: 'data/tapes.json',
})


game.assets.sounds = await game.loadAudio({
  
})
soundmanager.setSoundsTable(game.assets.sounds)

game.assets.textures = Object.fromEntries(
  Object.entries(game.assets.images).map(([name, image]) => [
    name, webgl.createTexture(image)
  ])
)

game.setScene(() => {
  // Global things
  game.addThing(new Selector());
  game.addThing(new AudioSystem());
  game.addThing(new ModuleEQ());

  game.globals.soundWave = [0, 0, 0, 0, 0, 0, 0, 0]

  // Camera setup
  game.getCamera3D().lookVector = [0, 0, -1];
  game.getCamera3D().upVector = [0, 1, 0];
  game.getCamera3D().near = 0.01;
  game.getCamera3D().isOrtho = true;
  game.getCamera3D().updateMatrices();
  game.getCamera3D().setUniforms();
})
