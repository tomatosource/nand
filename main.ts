import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';
import { IBox } from './interface';
import { setOutputDom, setInputDom, buildBoxHTML } from './utils';

export class App {
  canvas: Canvas;
  selectedBox: IBox;
  selectedIndex: number;
  selectionIsInput: boolean;

  clearSelection() {
    if (this.selectedBox == undefined) {
      return;
    }

    const state = this.selectionIsInput
      ? this.selectedBox.getInputState(this.selectedIndex)
      : this.selectedBox.getOutputState(this.selectedIndex);

    const ioContainers = this.selectedBox.ele.querySelectorAll('.ioContainer');
    const conns = this.selectionIsInput
      ? ioContainers[0].querySelectorAll('.connector')
      : ioContainers[1].querySelectorAll('.connector');

    conns[this.selectedIndex].className = `connector ${state ? 'on' : 'off'}`;
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
}

export class Connection {
  id: string;
  sourceBox: IBox;
  sourceIndex: number;
  destinationBox: IBox;
  destinationIndex: number;
  line: LeaderLine;

  constructor(
    sourceBox: IBox,
    sourceIndex: number,
    destinationBox: IBox,
    destinationIndex: number,
    initValue: boolean,
  ) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.sourceBox = sourceBox;
    this.sourceIndex = sourceIndex;
    this.destinationBox = destinationBox;
    this.destinationIndex = destinationIndex;

    destinationBox.setInput(destinationIndex, initValue);

    const sourceIOContainers = sourceBox.ele.querySelectorAll('.ioContainer');
    const sourceConns = sourceIOContainers[1].querySelectorAll('.connector');
    const destIOContainers = destinationBox.ele.querySelectorAll(
      '.ioContainer',
    );
    const destConns = destIOContainers[0].querySelectorAll('.connector');
    this.line = new LeaderLine(
      sourceConns[sourceIndex],
      destConns[destinationIndex],
      {
        startSocket: 'right',
        endSocket: 'left',
        color: initValue ? 'red' : 'grey',
        endPlug: 'disc',
        startPlug: 'disc',
      },
    );
  }
}

class Nand implements IBox {
	id: string;
  inputs: boolean[];
  inputConnections: Connection[];
  outputs: Connection[][];
  ele: HTMLElement;
  state: boolean;
  draggable: PlainDraggable;

  constructor(app: App) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.inputs = [false, false];
    this.inputConnections = [undefined, undefined];
    this.outputs = [[]];
    this.state = true;

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
          c.line.setOptions({
            color: this.state ? 'red' : 'grey',
          });
        });

        this.outputs[0].forEach(o => {
          o.destinationBox.setInput(o.destinationIndex, this.state);
        });
      }
    }
  }

  addInputConnection(sourceBox: IBox, sourceIndex: number, inputIndex: number) {
    if (this.inputConnections[inputIndex] != undefined) {
      return;
    }

    const conn = new Connection(
      sourceBox,
      sourceIndex,
      this,
      inputIndex,
      sourceBox.getOutputState(sourceIndex),
    );
    this.inputConnections[inputIndex] = conn;
    sourceBox.addOutputConnection(conn, sourceIndex);
    this.setInput(inputIndex, sourceBox.getOutputState(sourceIndex));
  }

  addOutputConnection(conn: Connection, index: number) {
    this.outputs[index].push(conn);
  }

  removeInputConnection(i: number) {
    const conn = this.inputConnections[i];
    if (conn != undefined) {
      conn.sourceBox.removeOutputConnection(conn.sourceIndex, conn.id);
      conn.line.remove();
      this.inputConnections[i] = undefined;
    }
  }

  removeOutputConnection(i: number, id: string) {
    this.outputs[i] = this.outputs[i].filter(c => c.id != id);
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
}

class SourceSwitch implements IBox {
	id: string;
  state: boolean;
  outputs: Connection[];
  ele: HTMLElement;

  constructor(app: App) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.state = false;
    this.outputs = [];

    const switchesContainer = document.getElementById('switchesContainer');
    this.ele = buildBoxHTML(app, this, 0, 1, 'SS');

    this.ele.addEventListener('click', e => {
      this.toggle(e);
      app.clearSelection();
      e.stopPropagation();
    });
    this.ele.className = 'box switch';
    switchesContainer.appendChild(this.ele);
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
        c.line.setOptions({
          color: this.state ? 'red' : 'grey',
        });
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
  ) {}

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
}

class Indicator implements IBox {
	id: string;
  state: boolean;
  ele: HTMLElement;
  input?: Connection;

  constructor(app: App) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.state = false;

    const switchesContainer = document.getElementById('indicatorsContainer');
    this.ele = buildBoxHTML(app, this, 1, 0, '');
    switchesContainer.appendChild(this.ele);
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
    }
  }

  addInputConnection(sourceBox: IBox, sourceIndex: number, inputIndex: number) {
    if (this.input != undefined) {
      return;
    }

    const conn = new Connection(
      sourceBox,
      sourceIndex,
      this,
      inputIndex,
      sourceBox.getOutputState(sourceIndex),
    );
    this.input = conn;
    sourceBox.addOutputConnection(conn, sourceIndex);
    this.setInput(inputIndex, sourceBox.getOutputState(sourceIndex));
  }

  addOutputConnection(conn: Connection, index: number) {}

  removeInputConnection(i: number) {
    const conn = this.input;
    conn.sourceBox.removeOutputConnection(conn.sourceIndex, conn.id);
    conn.line.remove();
    this.input = undefined;
  }

  removeOutputConnection(i: number, id: string) {}
  clearOutput(i: number) {}
}

class Canvas {
  inputs: SourceSwitch[];
  outputs: Indicator[];
  children: IBox[];

  constructor(app: App, inputCount: number, outputCount: number) {
    this.inputs = Array.apply(null, new Array(inputCount)).map(
      () => new SourceSwitch(app),
    );
    this.outputs = Array.apply(null, new Array(outputCount)).map(
      () => new Indicator(app),
    );
    this.children = [];
  }

  toggle(i: number) {
    this.inputs[i].toggle(null);
  }
}

function main() {
  // new 2in/1out canvas
  const c = new Canvas(app, 2, 1);
  app.canvas = c;

  setupKeys();
}

function setupKeys() {
  window.addEventListener('keyup', e => {
    switch (e.key) {
      case 'Backspace': {
        app.deleteActiveConnections();
        break;
      }
      case 'Delete': {
        app.deleteActiveConnections();
        break;
      }
      case 'Escape': {
        app.clearSelection();
        break;
      }
      case 's': {
        app.canvas.children.push(new Nand(app));
        break;
      }
    }
  });
}

const app = new App();
window.addEventListener('DOMContentLoaded', event => {
  main();
});
