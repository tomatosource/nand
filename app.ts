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

  savedBBs: SavedBB[];
  children: IBox[];
  gens: Generator[];

  constructor() {
    this.children = [];
    this.savedBBs = [];
    this.resetGens();
    this.loadSavedBBs();
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
    const chipID = uuid();

    let newBB = (app: App, id: string): IBox =>
      new BlackBox(app, true, g, label, id);
    this.gens.push({ f: newBB, label, id: chipID });
    this.clear();
    this.updateBar();

    this.savedBBs.push({
      graph: g,
      label: label,
      id: chipID,
    });
    localStorage.setItem('save_key', JSON.stringify(this.savedBBs));
  }

  loadSavedBBs() {
    let raw = localStorage.getItem('save_key');
    if (!raw) {
      return;
    }
    this.savedBBs = JSON.parse(raw);

    this.savedBBs.forEach(bb => {
      let newBB = (app: App, id: string): IBox =>
        new BlackBox(app, true, bb.graph, bb.label, id);
      this.gens.push({ f: newBB, label: bb.label, id: bb.id });
    });
  }

  updateBar() {
    const bar = document.getElementById('bar');
    bar.querySelectorAll('.barItem').forEach(c => c.remove());

    this.gens.forEach((g, i) => {
      const barItem = newDivWithClass('barItem');
      barItem.innerText = `${g.label}  (${i + 1})`;
      barItem.id = g.id;
      barItem.onclick = e => {
        this.children.push(g.f(this, uuid()));
        e.stopPropagation();
      };

      if (i > 2) {
        const x = newDivWithClass('barItemExit');
        x.innerText = 'x';
        x.onclick = e => {
          this.removeBarItem(g.id);
          e.stopPropagation();
        };
        barItem.appendChild(x);

        const edit = newDivWithClass('barItemEdit');
        edit.innerText = 'e';
        edit.onclick = e => {
          this.editBB(g.id);
          e.stopPropagation();
        };
        barItem.appendChild(edit);
      }

      bar.appendChild(barItem);
    });
  }

  editBB(id: String) {
    this.clear();
    const g = this.savedBBs.filter(sbb => sbb.id === id)[0].graph;

    g.nodes.forEach(n => {
      switch (n.kind) {
        case AtomType.I: {
          const i = new SourceSwitch(this, true, n.id);
          this.children.push(i);
          break;
        }
        case AtomType.O: {
          const o = new Indicator(this, true, n.id);
          this.children.push(o);
          break;
        }
        case AtomType.NAND: {
          const nand = new Nand(this, true, n.id);
          this.children.push(nand);
          break;
        }
        case AtomType.BB: {
          const bb = new BlackBox(this, true, n.innerG, n.label, n.id);
          this.children.push(bb);
          break;
        }
      }
    });

    g.edges.forEach(e => {
      const start = this.children.filter(c => c.id === e.n1)[0];
      const end = this.children.filter(c => c.id === e.n2)[0];
      start.addInputConnection(end, e.n2Index, e.n1Index);
    });
  }

  removeBarItem(id: string) {
    this.gens = this.gens.filter(g => g.id !== id);
    this.updateBar();

    this.savedBBs = this.savedBBs.filter(sbb => sbb.id !== id);
    localStorage.setItem('save_key', JSON.stringify(this.savedBBs));
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

  resetGens() {
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
  }
}

type Generator = {
  f: (app: App, id: string) => IBox;
  label: string;
  id: string;
};

type SavedBB = {
  graph: G;
  label: string;
  id: string;
};
