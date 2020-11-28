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
		if (!raw){
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
      const d = newDivWithClass('barItem');
      d.innerText = `${g.label}  (${i + 1})`;
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
