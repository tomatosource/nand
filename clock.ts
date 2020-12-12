import { App } from './app';
import { Connection } from './connection';
import { N, E, AtomType, InputConnection, IBox } from './interface';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import { Move } from './move';

export class Clock implements IBox {
  id: string;
  state: boolean;
  outputs: Connection[];
  rendered: boolean;
  ele?: HTMLElement;
  move: Move;

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id;
    this.state = false;
    this.outputs = [];
    this.rendered = rendered;

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 0, 1, 'clock');

      this.ele.className = 'box clock';
      canvasDiv.appendChild(this.ele);

      this.move = new Move(this.ele, () => {
        this.outputs.forEach(c => c.update());
      });
    }
    setInterval(() => {
      this.setInput(0, !this.state);
    }, 2000);
  }

  getOutputState(_: number): boolean {
    return this.state;
  }

  getInputState(_: number): boolean {
    return false;
  }

  setInput(_: number, v: boolean): void {
    if (this.state != v) {
      this.state = v;
      this.outputs.forEach(o => {
        o.destinationBox.setInput(o.destinationIndex, v);
      });
      setOutputDom(this.ele, 0, v);

      this.outputs.forEach(c => {
        if (c.line) {
          this.state ? c.on() : c.off();
        }
      });
    }
  }

  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): boolean {
    return false;
  }

  addOutputConnection(conn: Connection, _: number) {
    this.outputs.push(conn);
  }

  removeInputConnection(i: number) {}

  removeOutputConnection(_: number, id: string) {
    this.outputs = this.outputs.filter(c => c.id != id);
  }

  clearOutput(i: number) {
    while (true) {
      if (this.outputs.length > 0) {
        const conn = this.outputs[0];
        conn.destinationBox.removeInputConnection(conn.destinationIndex);
      } else {
        break;
      }
    }
  }

  removeAllConnections() {
    this.clearOutput(0);
  }

  getInputCount(): number {
    return 0;
  }

  getOutputCount(): number {
    return 1;
  }

  clearSelection(isInput: boolean, selectedIndex: number) {
    clearSelectionFromBox(this, isInput, selectedIndex);
  }

  clean() {
    this.removeAllConnections();
    if (this.ele !== undefined) {
      this.ele.remove();
    }
  }

  getNode(): N {
    return {
      id: this.id,
      kind: AtomType.INPUT,
      label: 'I',
    };
  }

  getEdges(): E[] {
    return [];
  }
}
