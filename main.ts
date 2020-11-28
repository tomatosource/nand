import { G, IBox, AtomType } from './interface';
import {
  newDivWithClass,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import { Nand } from './nand';
import { SourceSwitch } from './source_switch';
import { Indicator } from './indicator';
import { BlackBox } from './blackbox';
import { Canvas } from './canvas';
import { App } from './app';

import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';
import { v4 as uuid } from 'uuid';


function main() {
  const c = new Canvas(app);
  app.canvas = c;
  setupKeys();
}

function setupKeys() {
  window.addEventListener('keyup', e => {
    switch (e.key) {
      case 'Backspace': {
        app.deleteActiveConnections();
        break;
      }
      case 'Delete': {
        app.deleteActiveConnections();
        break;
      }
      case 'Escape': {
        app.clearSelection();
        break;
      }
      case 's': {
        app.canvas.saveNewBB();
        break;
      }
      case 'x': {
        app.deleteActiveBox();
        break;
      }
    }

    let a = Number(e.key);
    if (a != NaN && app.canvas.gens.length >= a && a > 0) {
      app.canvas.spawn(a-1);
    }
  });
}

const app = new App();
window.addEventListener('DOMContentLoaded', event => {
  main();
});
