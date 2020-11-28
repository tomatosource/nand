import { App } from './app';
import { Connection } from './connection';
import { N, E, AtomType, InputConnection, IBox } from './interface';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import PlainDraggable from 'plain-draggable';

export class SourceSwitch implements IBox {
  id: string;
  state: boolean;
  outputs: Connection[];
  rendered: boolean;
  ele?: HTMLElement;
  private draggable: PlainDraggable;

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id || (Math.random() + 1).toString(36).substring(7);
    this.state = false;
    this.outputs = [];
    this.rendered = rendered;

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 0, 1, 'input');

      this.ele.addEventListener('click', e => {
        this.toggle(e);
        app.clearSelection();
        e.stopPropagation();
      });
      this.ele.className = 'box switch';
      canvasDiv.appendChild(this.ele);

      this.draggable = new PlainDraggable(this.ele);
      this.draggable.onMove = () => {
        this.outputs.forEach(c => {
          if (c && c.line) {
            c.line.position();
          }
        });
      };
      this.draggable.snap = { step: 45 };
    }
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
          c.line.setOptions({
            color: this.state ? 'red' : 'grey',
          });
        }
      });
    }
  }

  toggle(e: MouseEvent): void {
    this.setInput(0, !this.state);
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
    if (this.draggable !== undefined) {
      this.draggable.remove();
    }
    if (this.ele !== undefined) {
      this.ele.remove();
    }
  }

  getNode(): N {
    return {
      id: this.id,
      kind: AtomType.I,
      label: 'I',
    };
  }

  getEdges(): E[] {
    return [];
  }
}

