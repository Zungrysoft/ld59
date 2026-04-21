import * as game from 'game'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Selector from './selector.js'
import AudioGraphManager from './audiosystem.js'
import TitleScreen from './titlescreen.js'


document.title = 'Cut Through'
game.setWidth(480)
game.setHeight(320)
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
for (const char of "abcdefghijklmnopqrstuvwxyz0123456789") {
  fontData["letter_" + char] = 'images/fontsmall/letter_small_' + char + '.png';
}
for (const symbol of ['slash', 'question_mark', 'colon', 'exclamation_point']) {
  fontData["letter_" + symbol] = 'images/fontsmall/letter_small_' + symbol + '.png';
}

game.assets.images = await game.loadImages({
  square: 'images/square.png',

  module_eq: 'images/module/eq.png',
  module_tapedeck: 'images/module/tapedeck.png',
  module_speakers: 'images/module/speakers.png',
  module_oscillator: 'images/module/oscillator.png',
  module_lowpass: 'images/module/lowpass.png',
  module_highpass: 'images/module/highpass.png',

  module_tapedeck_button_rewind: 'images/module/tapedeck_button_rewind.png',
  module_tapedeck_button_rewind_depressed: 'images/module/tapedeck_button_rewind_depressed.png',
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

  tape: 'images/ui/tape.png',
  tape_label_1: 'images/ui/tape_label_1.png',
  tape_label_2: 'images/ui/tape_label_2.png',
  tape_select: 'images/ui/tapeselect.png',

  transcribe: 'images/ui/transcribe.png',
  transcribe_close: 'images/ui/transcribe_close.png',

  tape_drawer: 'images/ui/tapedrawer.png',

  button_left: 'images/ui/button_left.png',
  button_right: 'images/ui/button_right.png',
  button_close: 'images/ui/button_close.png',

  titlescreen: 'images/ui/titlescreen.png',
  helpscreen: 'images/ui/helpscreen.png',

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
  play: 'sounds/play.wav',
  off: 'sounds/off.wav',
  on: 'sounds/on.wav',
  adjust: 'sounds/adjust.wav',
  adjust2: 'sounds/adjust2.wav',
  snip: 'sounds/snip.wav',
  clack: 'sounds/clack.wav',
  drawer_open: 'sounds/drawer_open.wav',
  drawer_close: 'sounds/drawer_close.wav',
})
soundmanager.setSoundsTable(game.assets.sounds)

const audioSystem = new AudioGraphManager();
game.assets.tapes = await game.loadTapes(audioSystem.ctx, {
  standoff: 'sounds/tapes/standoff_mono.mp3',
  tutorial1: 'sounds/tapes/tutorial1_mono.mp3',
  tutorial2: 'sounds/tapes/tutorial2_mono.mp3',
  bodycam: 'sounds/tapes/bodycam_mono.mp3',
  lab: 'sounds/tapes/lab_mono.mp3',
  diary: 'sounds/tapes/diary_mono.mp3',
  gasstation: 'sounds/tapes/gasstation_mono.mp3',
  court: 'sounds/tapes/court_mono.mp3',
  outro: 'sounds/tapes/outro_mono.mp3',
  carphone: 'sounds/tapes/carphone_mono.mp3',
  phone: 'sounds/tapes/phone_mono.mp3',
  politics: 'sounds/tapes/politics_mono.mp3',
  fight: 'sounds/tapes/fight_mono.mp3',
  defect: 'sounds/tapes/defect_mono.mp3',
})

game.assets.textures = Object.fromEntries(
  Object.entries(game.assets.images).map(([name, image]) => [
    name, webgl.createTexture(image)
  ])
)

game.setScene(() => {
  // Global things
  game.addThing(new Selector());
  game.addThing(new TitleScreen());

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
