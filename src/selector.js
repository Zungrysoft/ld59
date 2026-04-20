import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

export default class Selector extends Thing {
  lockActions = false
  prevActiveClickable = null

  update() {
    // Get list of clickables
    const clickables = game.getThings().filter(x => x.isClickable?.()).sort((a, b) => {
      // Tie-break by depth
      return a.depth - b.depth;
    });

    // Decide which clickable should be highlighted
    let activeClickable = null;
    for (const clickable of clickables) {
      if (clickable.isBeingDragged) {
        activeClickable = clickable;
        break;
      }
    }
    if (!activeClickable) {
      for (const clickable of clickables) {
        if (u.pointInsideAabb(...game.mouse.position, clickable.getAabb()) && !vec2.equals(game.mouse.position, [0, 0]) && !clickable.isDying) {
          activeClickable = clickable;
          break;
        }
      }
    }

    // Update isHighlighted status for all clickables
    for (const clickable of game.getThings()) {
      const shouldBeHighlighted = clickable === activeClickable;
      if (shouldBeHighlighted && !clickable.isHighlighted && !clickable.isSelected && !activeClickable.isGreyedOut && !clickable.noHoverSound) {
        soundmanager.playSound('click', 0.3, 0.9);
      }
      clickable.isHighlighted = shouldBeHighlighted;
    }

    // Active clickable
    if (activeClickable && !activeClickable.isHidden) {

      // Left Click
      if (game.mouse.leftClick) {
        this.lastClicked = activeClickable;
        if (activeClickable.onClick) {
          activeClickable.onClick();
        }
      }
    }

    // Left Release
    if (game.mouse.leftRelease && this.lastClicked) {
        if (this.lastClicked.onRelease) {
          this.lastClicked.onRelease();
        }
        this.lastClicked = null;
      }
  }
}
