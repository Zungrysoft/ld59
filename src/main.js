import * as game from 'game'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Selector from './selector.js'
import ModuleEQ from './module_eq.js'
import ModuleTapedeck from './module_tapedeck.js'
import ModuleSpeakers from './module_speakers.js'
import AudioGraphManager from './audiosystem.js'
import Desk from './desk.js'
import ModuleOscillator from './module_oscillator.js'


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
  fontData["letter_" + char] = 'images/fontsmall/letter_small_' + char + '.png';
}
// for (const symbol of ['comma', 'period', 'exclamation_point', 'question_mark', 'colon', 'apostraphe']) {
//   fontData["letter_symbol_" + symbol] = 'images/font/letter_symbol_' + symbol + '.png';
// }
// for (let i = 0; i < 10; i ++) {
//   fontData["letter_number_" + i.toString()] = 'images/font/letter_number_' + i.toString() + '.png';
// }

game.assets.images = await game.loadImages({
  square: 'images/square.png',

  module_eq: 'images/module/eq.png',
  module_tapedeck: 'images/module/tapedeck.png',
  module_speakers: 'images/module/speakers.png',
  module_oscillator: 'images/module/oscillator.png',

  module_tapedeck_button_restart: 'images/module/tapedeck_button_restart.png',
  module_tapedeck_button_restart_depressed: 'images/module/tapedeck_button_restart_depressed.png',
  module_tapedeck_button_play: 'images/module/tapedeck_button_play.png',
  module_tapedeck_button_play_depressed: 'images/module/tapedeck_button_play_depressed.png',
  module_tapedeck_button_pause: 'images/module/tapedeck_button_pause.png',
  module_tapedeck_button_pause_depressed: 'images/module/tapedeck_button_pause_depressed.png',
  module_tapedeck_button_load: 'images/module/tapedeck_button_load.png',
  module_tapedeck_button_load_depressed: 'images/module/tapedeck_button_load_depressed.png',
  module_tapedeck_label_1: 'images/module/tapedeck_label_1.png',
  module_tapedeck_label_2: 'images/module/tapedeck_label_2.png',

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
  switch1: 'sounds/switch.wav',
  switch2: 'sounds/switch2.wav',
  switch3: 'sounds/switch3.wav',
  switchloud1: 'sounds/switchloud.wav',
  switchloud2: 'sounds/switchloud2.wav',
  switchloud3: 'sounds/switchloud3.wav',
  switchloud4: 'sounds/switchloud4.wav',
  unload1: 'sounds/unload.wav',
  unload2: 'sounds/unload2.wav',
  unload3: 'sounds/unload3.wav',
  load: 'sounds/load.wav',
  rewind: 'sounds/rewind.wav',
})
soundmanager.setSoundsTable(game.assets.sounds)

const audioSystem = new AudioGraphManager();
game.assets.tapes = await game.loadTapes(audioSystem.ctx, {
  testmusic: 'sounds/tapes/testmusic.mp3',
  testsound: 'sounds/load.wav',
})

game.assets.textures = Object.fromEntries(
  Object.entries(game.assets.images).map(([name, image]) => [
    name, webgl.createTexture(image)
  ])
)

game.setScene(() => {
  // Global things
  game.addThing(new Selector());
  game.addThing(new Desk());
  game.addThing(new ModuleEQ('eq1', [170, 70]));
  game.addThing(new ModuleOscillator('sine1', [170, 170]));
  game.addThing(new ModuleTapedeck('audio1', [20, 20]));
  game.addThing(new ModuleSpeakers('speaker', [game.getWidth() - 32 - 2, 2]));

  game.globals.soundWave = [0, 0, 0, 0, 0, 0, 0, 0]

  game.globals.audioSystem = audioSystem;

  // Camera setup
  game.getCamera3D().lookVector = [0, 0, -1];
  game.getCamera3D().upVector = [0, 1, 0];
  game.getCamera3D().near = 0.01;
  game.getCamera3D().isOrtho = true;
  game.getCamera3D().updateMatrices();
  game.getCamera3D().setUniforms();
})
