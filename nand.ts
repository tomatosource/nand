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

export class Nand implements IBox {
  id: string;
  inputs: boolean[];
  inputConnections: Connection[];
  outputs: Connection[][];
  state: boolean;
  rendered: boolean;
  ele?: HTMLElement;
  move: Move;

  constructor(app: App, rendered: boolean, id?: string) {
    this.id = id || (Math.random() + 1).toString(36).substring(7);
    this.rendered = rendered;
    this.inputs = [false, false];
    this.inputConnections = [undefined, undefined];
    this.outputs = [[]];
    this.state = true;

    if (rendered) {
      const canvasDiv = document.getElementById('canvas');
      this.ele = buildBoxHTML(app, this, 2, 1, 'nand');
      canvasDiv.appendChild(this.ele);
      setOutputDom(this.ele, 0, this.state);

      this.move = new Move(this.ele, () => {
        this.inputConnections.forEach(c => {
          if (c) {
            c.update();
          }
        });
        this.outputs.forEach(ocs => {
          ocs.forEach(c => {
            if (c) {
              c.update();
            }
          });
        });
      });
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
            c.line.setColor(this.state ? 'red' : 'grey');
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
    this.setInput(i, false);
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
    if (this.ele !== undefined) {
      this.ele.remove();
    }
  }

  getNode(): N {
    return {
      id: this.id,
      kind: AtomType.NAND,
      label: 'NAND',
    };
  }

  getEdges(): E[] {
    return this.inputConnections.map((c, i) => ({
      n1: this.id,
      n1Index: i,
      n2: c.sourceBox.id,
      n2Index: c.sourceIndex,
    }));
  }
}
