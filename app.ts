import { Connection } from './connection';
import { G, N, E, AtomType, InputConnection, IBox } from './interface';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
	newDivWithClass,
} from './utils';
import { Nand } from './nand';
import { SourceSwitch } from './source_switch';
import { Indicator } from './indicator';
import { BlackBox } from './blackbox';

import PlainDraggable from 'plain-draggable';
import { v4 as uuid } from 'uuid';

export class App {
  selectedBox: IBox;
  selectedIndex: number;
  selectionIsInput: boolean;

  children: IBox[];
  gens: Generator[];

  constructor() {
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
        this.children.push(g.f(this, uuid()));
      };
      bar.appendChild(d);
    });
  }

  spawn(i: number) {
    this.children.push(this.gens[i].f(this, uuid()));
  }
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
    this.remove(selected);
  }
}

type Generator = {
  f: (app: App, id: string) => IBox;
  label: string;
  id: string;
};

