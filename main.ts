import { G, IBox, BlackBox, AtomType } from './interface';
import {
  newDivWithClass,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import { Nand, SourceSwitch, Indicator } from './atoms';
import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';
import { v4 as uuid } from 'uuid';

export class App {
  canvas: Canvas;
  selectedBox: IBox;
  selectedIndex: number;
  selectionIsInput: boolean;

  clearSelection() {
    if (this.selectedBox == undefined) {
      return;
    }

    this.selectedBox.clearSelection(this.selectionIsInput, this.selectedIndex);

    this.selectedBox = undefined;
    this.selectedIndex = 0;
    this.selectionIsInput = false;
  }

  deleteActiveConnections() {
    if (this.selectedBox == undefined) {
      return;
    }
    if (this.selectionIsInput) {
      this.selectedBox.removeInputConnection(this.selectedIndex);
    } else {
      this.selectedBox.clearOutput(this.selectedIndex);
    }
    this.clearSelection();
  }

  deleteActiveBox() {
    if (this.selectedBox == undefined) {
      return;
    }
    const selected = this.selectedBox;
    this.clearSelection();
    this.canvas.remove(selected);
  }
}

export class Connection {
  id: string;
  sourceBox: IBox;
  sourceIndex: number;
  destinationBox: IBox;
  destinationIndex: number;
  line?: LeaderLine;
  rendered: boolean;

  constructor(
    sourceBox: IBox,
    sourceIndex: number,
    destinationBox: IBox,
    destinationIndex: number,
    initValue: boolean,
    rendered: boolean,
  ) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.sourceBox = sourceBox;
    this.sourceIndex = sourceIndex;
    this.destinationBox = destinationBox;
    this.destinationIndex = destinationIndex;
    this.rendered = rendered;

    destinationBox.setInput(destinationIndex, initValue);

    if (rendered) {
      const sourceIOContainers = sourceBox.ele.querySelectorAll('.ioContainer');
      const sourceConns = sourceIOContainers[1].querySelectorAll('.connector');
      const destIOContainers = destinationBox.ele.querySelectorAll(
        '.ioContainer',
      );
      const destConns = destIOContainers[0].querySelectorAll('.connector');
      this.line = new LeaderLine(
        sourceConns[sourceIndex],
        destConns[destinationIndex],
        {
          startSocket: 'right',
          endSocket: 'left',
          color: initValue ? 'red' : 'grey',
          endPlug: 'disc',
          startPlug: 'disc',
        },
      );
    }
  }
}

type Generator = {
  f: (app: App, id: string) => IBox;
  label: string;
  id: string;
};

class Canvas {
  app: App;
  children: IBox[];
  gens: Generator[];

  constructor(app: App) {
    this.app = app;
    this.children = [];
    this.gens = [
      {
        f: (app: App, id: string) => new SourceSwitch(app, true, id),
        label: 'input',
        id: uuid(),
      },
      {
        f: (app: App, id: string) => new Indicator(app, true, id),
        label: 'output',
        id: uuid(),
      },
      {
        f: (app: App, id: string) => new Nand(app, true, id),
        label: 'nand',
        id: uuid(),
      },
    ];
    this.updateBar();
  }

  remove(box: IBox) {
    box.clean();
    const id = box.id;

    this.children = this.children.filter(c => c.id !== id);
  }

  makeG(): G {
    const nodes = this.children.map(c => c.getNode());
    let edges = [];
    this.children.forEach(c => edges.push(...c.getEdges()));
    return {
      nodes,
      edges,
    };
  }

  clear() {
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }
  }

  saveNewBB() {
    const g = this.makeG();
    const label = prompt('label', '');

    let newBB = (app: App, id: string): IBox =>
      new BlackBox(app, true, g, label, id);
    this.gens.push({ f: newBB, label, id: uuid() });
    this.clear();
    this.updateBar();
  }

  updateBar() {
    const bar = document.getElementById('bar');
    bar.querySelectorAll('.barItem').forEach(c => c.remove());

    this.gens.forEach((g, i) => {
      const d = newDivWithClass('barItem');
      d.innerText = `${g.label}  (${i+1})`;
      d.id = g.id;
      d.onclick = e => {
        this.children.push(g.f(app, uuid()));
      };
      bar.appendChild(d);
    });
  }

  spawn(i: number) {
    this.children.push(this.gens[i].f(app, uuid()));
  }
}

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
