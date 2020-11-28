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

export class Indicator implements IBox {
  id: string;
  state: boolean;
  input?: Connection;
  rendered: boolean;
  ele?: HTMLElement;
  private draggable: PlainDraggable;
  forwardingList: InputConnection[];
  callback: (state: boolean) => void;

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id || (Math.random() + 1).toString(36).substring(7);
    this.state = false;
    this.rendered = rendered;
    this.forwardingList = [];
    this.callback = () => {};

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 1, 0, 'output');
      canvasDiv.appendChild(this.ele);

      this.draggable = new PlainDraggable(this.ele);
      this.draggable.snap = { step: 45 };
      this.draggable.onMove = () => {
        if (this.input && this.input.line) {
          this.input.line.position();
        }
      };
    }
  }

  getOutputState(_: number): boolean {
    return false;
  }

  getInputState(_: number): boolean {
    return this.state;
  }

  setInput(i: number, v: boolean): void {
    if (v != this.state) {
      this.state = v;
      setInputDom(this.ele, i, v);
      this.forwardingList.forEach(ic => {
        ic.box.setInput(ic.index, v);
      });
      this.callback(v);
    }
  }

  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): boolean {
    if (this.input != undefined) {
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
    this.input = conn;
    sourceBox.addOutputConnection(conn, sourceIndex);
    this.setInput(inputIndex, sourceBox.getOutputState(sourceIndex));

    return true;
  }

  addOutputConnection(conn: Connection, index: number) {}

  removeInputConnection(i: number) {
    const conn = this.input;
    if (conn !== undefined) {
      conn.sourceBox.removeOutputConnection(conn.sourceIndex, conn.id);
      conn.line.remove();
      this.input = undefined;
      this.setInput(i, false);
    }
  }

  removeAllConnections() {
    this.removeInputConnection(0);
  }

  removeOutputConnection(i: number, id: string) {}

  clearOutput(i: number) {}

  getInputCount(): number {
    return 1;
  }

  getOutputCount(): number {
    return 0;
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

  getState(): boolean {
    return this.state;
  }

  getNode(): N {
    return {
      id: this.id,
      kind: AtomType.O,
      label: 'O',
    };
  }

  getEdges(): E[] {
    if (this.input === undefined) {
      return [];
    }
    return [
      {
        n1: this.id,
        n1Index: 0,
        n2: this.input.sourceBox.id,
        n2Index: this.input.sourceIndex,
      },
    ];
  }
}
