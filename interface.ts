import { App, Connection } from './main';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import { Nand, SourceSwitch, Indicator } from './atoms';
import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';

export interface IBox {
  id: string;
  rendered: boolean;
  ele?: HTMLElement;

  setInput(i: number, v: boolean): void;
  getOutputState(i: number): boolean;
  getInputState(i: number): boolean;
  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): boolean;
  addOutputConnection(connection: Connection, index: number): void;
  removeInputConnection(index: number): void;
  removeOutputConnection(index: number, id: string): void;
  clearOutput(index: number): void;
  removeAllConnections(): void;
  getInputCount(): number;
  getOutputCount(): number;
  clean(): void;
  clearSelection(isInput: boolean, selectedIndex: number): void;
}

interface G {
  nodes: N[];
  edges: E[];
}

interface E {
  n1: string;
  n1Index: number;
  n2: string;
  n2Index: number;
}

enum AtomType {
  BB,
  NAND,
  I,
  O,
  // C,
  // ON,
  // OFF,
}

interface N {
  id: string;
  innerG?: G;
  kind: AtomType;
  label: string;
}

export class InputConnection {
	box: IBox;
	index: number;

	constructor(box: IBox, index: number) {
		this.box =  box;
		this.index= index;
	}
}

export class BlackBox implements IBox {
  id: string;
  inputs: boolean[];
	outputs: boolean[];
	inputConnections: Connection[];
  outputConnections: Connection[][];
  label: string;
  state: boolean;
  rendered: boolean;
  children: IBox[];
  childInputs: SourceSwitch[];
  childOutputs: Indicator[];
  ele?: HTMLElement;
  graph: G;
  private draggable: PlainDraggable;

  constructor(
    app: App,
    rendered: boolean,
    graph: G,
    label: string,
    id: string,
  ) {
    this.id = id;
    this.rendered = rendered;
    this.inputs = [];
		this.inputConnections = [];
		this.childInputs = [];
		this.childOutputs= [];
    this.outputs = [];
    this.state = true;
    this.graph = graph;
    this.label = label;
		this.outputs = [];

    const inputCount = graph.nodes.filter(n => (n.kind = AtomType.I)).length;
    const outputCount = graph.nodes.filter(n => (n.kind = AtomType.O)).length;
		for (let i=0; i<outputCount; i++) {
			this.outputs.push(false);
			this.outputConnections.push([]);
		}
		for (let i=0; i<inputCount; i++) {
			this.inputs.push(false);
		}

    graph.nodes.forEach(n => {
      switch (n.kind) {
        case AtomType.I: {
          const i = new SourceSwitch(app, false, n.id);
          this.childInputs.push(i);
          this.children.push(i);
          break;
        }
        case AtomType.O: {
          const o = new Indicator(app, false, n.id);
          this.childOutputs.push(o);
          this.children.push(o);
          break;
        }
        case AtomType.NAND: {
          const nand = new Nand(app, false, n.id);
          this.children.push(nand);
          break;
        }
        case AtomType.BB: {
          const bb = new BlackBox(app, false, n.innerG, n.label, n.id);
          this.children.push(bb);
          break;
        }
      }
    });

		graph.edges.forEach(e => {
			const start = this.children.filter(c => c.id === e.n1)[0];
			const end = this.children.filter(c => c.id === e.n2)[0];
			start.addInputConnection(end, e.n2Index, e.n1Index);
		});

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, inputCount, outputCount, label);
      canvasDiv.appendChild(this.ele);
      setOutputDom(this.ele, 0, this.state);
      this.draggable = new PlainDraggable(this.ele);
      this.draggable.snap = { step: 45 };
      // on drag sync up lines
      this.draggable.onMove = () => {
        this.inputConnections.forEach(c => {
          if (c && c.line) {
            c.line.position();
          }
        });
        this.outputConnections.forEach(o => {
          o.forEach(c => {
            if (c && c.line) {
              c.line.position();
            }
          });
        });
      };
    }
  }

  getOutputState(i: number): boolean {
    return this.outputs[i];
  }

  getInputState(i: number): boolean {
    return this.inputs[i];
  }

  setInput(i: number, v: boolean): void {
		this.childInputs[i].setInput(0, v);
	}

  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): boolean {
    if (this.inputConnections[inputIndex] != undefined) {
      return false;
    }

    const conn = new Connection(
      sourceBox,
      sourceIndex,
      this,
      inputIndex,
      sourceBox.getOutputState(sourceIndex),
      this.rendered,
    );
    this.inputConnections[inputIndex] = conn;
    sourceBox.addOutputConnection(conn, sourceIndex);
    this.setInput(inputIndex, sourceBox.getOutputState(sourceIndex));

    return true;
	}

  addOutputConnection(conn: Connection, index: number) {
    this.outputConnections[index].push(conn);
		this.childOutputs[index].forwardingList.push(new InputConnection(conn.destinationBox, conn.destinationIndex));
	}

  removeInputConnection(i: number) {
    const conn = this.inputConnections[i];
    if (conn != undefined) {
      conn.sourceBox.removeOutputConnection(conn.sourceIndex, conn.id);
      if (conn.rendered) {
        conn.line.remove();
      }
      this.inputConnections[i] = undefined;
    }
	}

  removeOutputConnection(i: number, id: string) {
    this.outputConnections[i] = this.outputConnections[i].filter(c => c.id != id);
		this.childOutputs[i].forwardingList = this.childOutputs[i].forwardingList.filter(ic => ic.box.id != id);
	}

  removeAllConnections() {
    this.inputs.forEach((_, i) => {
      this.removeInputConnection(i);
    });
    this.outputs.forEach((_, i) => {
      this.clearOutput(i);
    });
	}

  clearOutput(i: number) {
    while (true) {
      if (this.outputConnections[i].length > 0) {
        const conn = this.outputs[i][0];
        conn.destinationBox.removeInputConnection(conn.destinationIndex);
      } else {
        break;
      }
    }
	}

  getInputCount(): number {
    return this.childOutputs.length;
  }

  getOutputCount(): number {
    return this.childInputs.length;
  }

  clearSelection(isInput: boolean, selectedIndex: number) {
    clearSelectionFromBox(this, isInput, selectedIndex);
  }

  clean() {
    this.removeAllConnections();
    if (this.draggable !== undefined) {
      this.draggable.remove();
    }
    if (this.ele !== undefined) {
      this.ele.remove();
    }
  }
}
