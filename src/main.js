import * as game from 'game'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Selector from './selector.js'
import ModuleEQ from './module_eq.js'
import AudioSystem from './audiosystem.js'
import ModuleTapedeck from './module_tapedeck.js'
import ModuleSpeakers from './module_speakers.js'

document.title = 'Cut Through'
game.setWidth(360)
game.setHeight(240)
game.createCanvases();
const { ctx } = game
ctx.save()
ctx.fillStyle = 'white'
ctx.font = 'italic bold 20px Arial'
ctx.fillText('Loading audio...', 16, game.getHeight() - 32)
ctx.font = 'italic bold 16px Arial'
ctx.fillText('(this may take a minute or so)', 16, game.getHeight() - 16)
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
  module_tapedeck: 'images/module/tapedeck.png',
  module_speakers: 'images/module/speakers.png',

  module_tapedeck_button_restart: 'images/module/tapedeck_button_restart.png',
  module_tapedeck_button_restart_depressed: 'images/module/tapedeck_button_restart_depressed.png',
  module_tapedeck_button_play: 'images/module/tapedeck_button_play.png',
  module_tapedeck_button_play_depressed: 'images/module/tapedeck_button_play_depressed.png',
  module_tapedeck_button_pause: 'images/module/tapedeck_button_pause.png',
  module_tapedeck_button_pause_depressed: 'images/module/tapedeck_button_pause_depressed.png',
  module_tapedeck_button_load: 'images/module/tapedeck_button_load.png',
  module_tapedeck_button_load_depressed: 'images/module/tapedeck_button_load_depressed.png',

  jack: 'images/ui/jack.png',
  jack_disabled: 'images/ui/jack_disabled.png',
  jack_selected: 'images/ui/jack_selected.png',
  link: 'images/ui/link.png',

  ...fontData,
})

game.assets.data = await game.loadJson({
  tapes: 'data/tapes.json',
})


game.assets.sounds = await game.loadAudio({
  click: 'sounds/click.wav',
  plug_in: 'sounds/plug_in.wav',
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
  game.addThing(new ModuleEQ([170, 70]));
  game.addThing(new ModuleTapedeck([20, 20]));
  game.addThing(new ModuleSpeakers([game.getWidth() - 32 - 2, 2]));

  game.globals.soundWave = [0, 0, 0, 0, 0, 0, 0, 0]

  // Camera setup
  game.getCamera3D().lookVector = [0, 0, -1];
  game.getCamera3D().upVector = [0, 1, 0];
  game.getCamera3D().near = 0.01;
  game.getCamera3D().isOrtho = true;
  game.getCamera3D().updateMatrices();
  game.getCamera3D().setUniforms();
})
