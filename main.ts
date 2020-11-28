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
import { App } from './app';

import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';
import { v4 as uuid } from 'uuid';


function main() {
	app = new App();
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
        app.saveNewBB();
        break;
      }
      case 'x': {
        app.deleteActiveBox();
        break;
      }
    }

    let a = Number(e.key);
    if (a != NaN && app.gens.length >= a && a > 0) {
      app.spawn(a-1);
    }
  });
}

let app: App;
window.addEventListener('DOMContentLoaded', event => {
  main();
});
