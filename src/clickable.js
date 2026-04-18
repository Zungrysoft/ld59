import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText, getTextHeight } from './draw.js'

export default class Clickable extends Thing {
  aabb = [0, 0, 0, 0]

  constructor(parent, key, aabb) {
    super();

    this.parent = parent;
    this.key = key;

    if (aabb) {
      this.aabb = aabb;
    }
  }

  onClick() {
    if (!this?.parent?.onClickChild) {
      return;
    }

    this.parent.onClickChild(this.key);
  }

  onRelease() {
    if (!this?.parent?.onReleaseChild) {
      return;
    }

    this.parent.onReleaseChild(this.key);
  }

  getAabb() {
    let parentPos = [0, 0];
    if (this.parent?.position) {
      parentPos = this.parent.position;
    }

    return [
      ...vec2.add([this.aabb[0], this.aabb[1]], parentPos),
      ...vec2.add([this.aabb[2], this.aabb[3]], parentPos),
    ];
  }

  setAabb(position, width, height) {
    this.aabb[0] = position[0];
    this.aabb[1] = position[1];
    this.aabb[2] = position[0] + width;
    this.aabb[3] = position[1] + height;
  }

  isClickable() {
    if (!this?.parent?.isChildClickable) {
      return false;
    }

    return this.parent.isChildClickable(this.key);
  }
}
