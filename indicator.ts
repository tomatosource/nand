import { App } from './app';
import { Connection } from './connection';
import { N, E, AtomType, InputConnection, IBox } from './interface';
import {
  clearSelectionFromBox,
  setOutputDom,
  setInputDom,
  buildBoxHTML,
  uuid,
} from './utils';
import { Move } from './move';

export class Indicator implements IBox {
  id: string;
  state: boolean;
  input?: Connection;
  rendered: boolean;
  ele?: HTMLElement;
  forwardingList: InputConnection[];
  callback: (state: boolean) => void;
  flag: string;
  move: Move;

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
      this.move = new Move(this.ele, () => {
        if (this.input) {
          this.input.update();
        }
      });
    }
  }

  getOutputState(_: number): boolean {
    return false;
  }

  getInputState(_: number): boolean {
    return this.state;
  }

  setInput(i: number, v: boolean): void {
    let x = uuid();
    this.flag = x;
    setTimeout(() => {
      if (this.flag == x) {
        if (v != this.state) {
          this.state = v;
          setInputDom(this.ele, i, v);
          this.forwardingList.forEach(ic => {
            ic.box.setInput(ic.index, v);
          });
          this.callback(v);
        }
      }
    }, Math.random() * 10);
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
      kind: AtomType.OUTPUT,
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
