import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText, getTextHeight } from './draw.js'
import Clickable from './clickable.js'
import { getTapeTranscribedCount, getTotalTranscribedCount } from './save.js'
import ModuleTapedeck from './module_tapedeck.js'

const TAPES_PER_PAGE = 10;

const BUTTON_POS_LEFT = [40, 124];
const BUTTON_POS_RIGHT = [40 + 32, 124];
const BUTTON_POS_CLOSE = [40 + 64, 124];

export default class TapeDrawer extends Thing {
  page = 0
  clickables = []

  constructor() {
    super();
    game.setThingName(this, 'tapeDrawer')

    this.isOpen = false;

    this.tapes = [];
    this.position = [0, -200]
    
    for (const tapeKey in game.assets.data.tapes) {
      this.tapes.push({
        ...game.assets.data.tapes[tapeKey],
        id: tapeKey,
      });
    }

    this.tapes.sort((a, b) => a.pointsToUnlock - b.pointsToUnlock);

    for (let i = 0; i < TAPES_PER_PAGE; i ++) {
      const aabb = this.getTapeAabb(i);
      this.clickables.push(game.addThing(new Clickable(this, i, aabb)))
    }
  }

  getTapePos(i) {
    return [
      Math.floor(i/2) * 80,
      i % 2 === 0 ? 0 : 60,
    ];
  }

  getTapeAabb(i) {
    return [
      Math.floor(i/2) * 80,
      i % 2 === 0 ? 0 : 60,
      (Math.floor(i/2) + 1) * 80,
      i % 2 === 0 ? 60 : 120,
    ];
  }

  update() {
    const desiredY = this.isOpen ? 0 : -150;
    this.position[1] = u.lerp(this.position[1], desiredY, 0.3);
  }

  open(tapePlayerModule) {
    this.isOpen = true
    this.tapePlayerModule = tapePlayerModule;
    //TODO: Sound
  }

  close() {
    this.isOpen = false
    //TODO: Sound
  }

  isChildClickable(i) {
    let ind = i + this.page * TAPES_PER_PAGE;

    if (ind >= this.tapes.length) {
      return false;
    }

    return this.isTapeHere(this.tapes[i].id)
  }

  onClickChild(i) {
    let ind = i + this.page * TAPES_PER_PAGE;

    this.close();
    if (this.tapePlayerModule) {
      this.tapePlayerModule.loadTape(this.tapes[ind].id)
    }
  }

  isTapeHere(tapeId) {
    if (getTotalTranscribedCount() < game.assets.data.tapes[tapeId].pointsToUnlock) {
      return false;
    }

    for (const tapedeck of game.getThings().filter(x => x instanceof ModuleTapedeck)) {
      if (tapedeck.loadedTape === tapeId) {
        return false;
      }
    }

    return true;
  }

  draw() {
    drawSprite({
      sprite: game.assets.textures.tape_drawer,
      position: this.position,
      width: 480,
      height: 144,
      depth: 60,
    })

    for (let i = 0; i < TAPES_PER_PAGE; i ++) {
      let ind = i + this.page * TAPES_PER_PAGE;

      if (ind >= this.tapes.length) {
        break;
      }

      if (!this.isTapeHere(this.tapes[ind].id)) {
        continue;
      }

      drawSprite({
        sprite: game.assets.textures.tape,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        depth: 61,
      })
      drawSprite({
        sprite: game.assets.textures.tape_label_1,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        color: this.tapes[i].color_1,
        depth: 61,
      })
      drawSprite({
        sprite: game.assets.textures.tape_label_2,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        color: this.tapes[i].color_2,
        depth: 61,
      })
      if (this.clickables[i].isHighlighted) {
        drawSprite({
          sprite: game.assets.textures.tape_select,
          position: vec2.add(this.position, this.getTapePos(i)),
          width: 128,
          height: 128,
          depth: 64,
        })
      }
      drawText({
        text: this.tapes[i].title,
        depth: 62,
        color: this.tapes[i].color_3,
        position: vec2.add(vec2.add(this.position, this.getTapePos(i)), [9, 9]),
      })

      const [complete, total] = getTapeTranscribedCount(this.tapes[i].id);
      drawText({
        text: `Transcriptions: ${complete}/${total}`,
        depth: 63,
        color: complete === total ? [0.0, 1.0, 0.0] : [1.0, 1.0, 1.0],
        position: vec2.add(vec2.add(this.position, this.getTapePos(i)), [1, 51]),
      })
    }
  }
}
