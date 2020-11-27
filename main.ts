import { IBox } from './interface';
import { setOutputDom, setInputDom, buildBoxHTML } from './utils';
import LeaderLine from 'leader-line';
import PlainDraggable from 'plain-draggable';

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

  deleteActiveBox() {
    if (this.selectedBox == undefined) {
      return;
    }
    const selected = this.selectedBox;
    this.clearSelection();
    this.canvas.remove(selected);
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

  addInputConnection(sourceBox: IBox, sourceIndex: number, inputIndex: number): boolean {
    if (this.inputConnections[inputIndex] != undefined) {
      return false;
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

		return true;
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
}

class SourceSwitch implements IBox {
  id: string;
  state: boolean;
  outputs: Connection[];
  ele: HTMLElement;
  draggable: PlainDraggable;

  constructor(app: App) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.state = false;
    this.outputs = [];

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
}

class Indicator implements IBox {
  id: string;
  state: boolean;
  ele: HTMLElement;
  input?: Connection;
  draggable: PlainDraggable;

  constructor(app: App) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.state = false;

    const canvasDiv = document.getElementById('canvas');
    this.ele = buildBoxHTML(app, this, 1, 0, '');
    canvasDiv.appendChild(this.ele);

    this.draggable = new PlainDraggable(this.ele);
		this.draggable.snap = { step: 45 };
    this.draggable.onMove = () => {
      this.input.line.position();
		};
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

  addInputConnection(sourceBox: IBox, sourceIndex: number, inputIndex: number): boolean{
    if (this.input != undefined) {
      return false;
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
}

class Canvas {
  app: App;
  inputs: SourceSwitch[];
  outputs: Indicator[];
  children: IBox[];

  constructor(app: App) {
    this.app = app;
    this.children = [];
    this.inputs = [];
    this.outputs = [];
  }

  toggle(i: number) {
    this.inputs[i].toggle(null);
  }

  remove(box: IBox) {
    box.removeAllConnections();
    box.draggable.remove();
    box.ele.remove();
    const id = box.id;

    this.inputs = this.inputs.filter(i => i.id !== id);
    this.outputs = this.outputs.filter(o => o.id !== id);
    this.children = this.children.filter(c => c.id !== id);
  }
}

function main() {
  // new 2in/1out canvas
  const c = new Canvas(app);
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
      case 'n': {
        app.canvas.children.push(new Nand(app));
        break;
      }
      case 'i': {
        app.canvas.inputs.push(new SourceSwitch(app));
        break;
      }
      case 'o': {
        app.canvas.outputs.push(new Indicator(app));
        break;
      }
      case 'x': {
        app.deleteActiveBox();
        break;
      }
    }
  });
}

const app = new App();
window.addEventListener('DOMContentLoaded', event => {
  main();
});
