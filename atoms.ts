import { Connection, App } from './main';
import { InputConnection, IBox } from './interface';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
} from './utils';
import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';

export class Nand implements IBox {
  id: string;
  inputs: boolean[];
  inputConnections: Connection[];
  outputs: Connection[][];
  state: boolean;
  rendered: boolean;
  ele?: HTMLElement;
  private draggable: PlainDraggable;

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id || (Math.random() + 1).toString(36).substring(7);
    this.rendered = rendered;
    this.inputs = [false, false];
    this.inputConnections = [undefined, undefined];
    this.outputs = [[]];
    this.state = true;

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 2, 1, 'NAND');
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
        this.outputs.forEach(o => {
          o.forEach(c => {
            if (c && c.line) {
              c.line.position();
            }
          });
        });
      };
    }
  }

  getOutputState(_: number): boolean {
    return this.state;
  }

  getInputState(i: number): boolean {
    return this.inputs[i];
  }

  setInput(i: number, v: boolean): void {
    if (this.inputs[i] != v) {
      this.inputs[i] = v;
      const newState = !(this.inputs[0] && this.inputs[1]);
      setInputDom(this.ele, i, v);
      if (this.state != newState) {
        this.state = newState;
        setOutputDom(this.ele, 0, this.state);

        this.outputs[0].forEach(c => {
          if (c.line) {
            c.line.setOptions({
              color: this.state ? 'red' : 'grey',
            });
          }
        });

        this.outputs[0].forEach(o => {
          o.destinationBox.setInput(o.destinationIndex, this.state);
        });
      }
    }
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
    this.outputs[index].push(conn);
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
    this.outputs[i] = this.outputs[i].filter(c => c.id != id);
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
      if (this.outputs[i].length > 0) {
        const conn = this.outputs[i][0];
        conn.destinationBox.removeInputConnection(conn.destinationIndex);
      } else {
        break;
      }
    }
  }

  getInputCount(): number {
    return 2;
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
}

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
      this.ele = buildBoxHTML(app, this, 0, 1, 'SS');

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
}

export class Indicator implements IBox {
  id: string;
  state: boolean;
  input?: Connection;
  rendered: boolean;
  ele?: HTMLElement;
  private draggable: PlainDraggable;
  forwardingList: InputConnection[];

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id || (Math.random() + 1).toString(36).substring(7);
    this.state = false;
    this.rendered = rendered;
    this.forwardingList = [];

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 1, 0, '');
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
    conn.sourceBox.removeOutputConnection(conn.sourceIndex, conn.id);
    conn.line.remove();
    this.input = undefined;
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
}
