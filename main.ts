import LeaderLine from 'leader-line';

class App {
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

interface IBox {
  ele: HTMLElement;
  setInput(i: number, v: boolean): void;
  getOutputState(i: number): boolean;
  getInputState(i: number): boolean;
  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): void;
  addOutputConnection(connection: Connection, index: number): void;
  removeInputConnection(index: number): void;
  removeOutputConnection(index: number, id: string): void;
  clearOutput(index: number): void;
}

class Connection {
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
  inputs: boolean[];
  inputConnections: Connection[];
  outputs: Connection[][];
  ele: HTMLElement;
  state: boolean;

  constructor() {
    this.inputs = [false, false];
    this.inputConnections = [undefined, undefined];
    this.outputs = [[]];
    this.state = true;

    const canvasDiv = document.getElementById('canvas');
    this.ele = buildBoxHTML(this, 2, 1, 'NAND');
    canvasDiv.appendChild(this.ele);
    setOutputDom(this.ele, 0, this.state);
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
  state: boolean;
  outputs: Connection[];
  ele: HTMLElement;

  constructor() {
    this.state = false;
    this.outputs = [];

    const switchesContainer = document.getElementById('switchesContainer');
    this.ele = buildBoxHTML(this, 0, 1, 'SS');

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

function setOutputDom(ele: HTMLElement, index: number, state: boolean) {
  const ioContainers = ele.querySelectorAll('.ioContainer');
  const conns = ioContainers[1].querySelectorAll('.connector');
  conns[index].className = `connector ${state ? 'on' : 'off'}`;
}

function setInputDom(ele: HTMLElement, index: number, state: boolean) {
  const ioContainers = ele.querySelectorAll('.ioContainer');
  const conns = ioContainers[0].querySelectorAll('.connector');
  conns[index].className = `connector ${state ? 'on' : 'off'}`;
}

class Indicator implements IBox {
  state: boolean;
  ele: HTMLElement;
  input?: Connection;

  constructor() {
    this.state = false;

    const switchesContainer = document.getElementById('indicatorsContainer');
    this.ele = buildBoxHTML(this, 1, 0, '');
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

  constructor(inputCount: number, outputCount: number) {
    this.inputs = Array.apply(null, new Array(inputCount)).map(
      () => new SourceSwitch(),
    );
    this.outputs = Array.apply(null, new Array(outputCount)).map(
      () => new Indicator(),
    );
    this.children = [];
  }

  toggle(i: number) {
    this.inputs[i].toggle(null);
  }
}

function buildBoxHTML(
  box: IBox,
  inputs: number,
  outputs: number,
  label: string,
): HTMLElement {
  const container = newDivWithClass('box');

  const inputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < inputs; i++) {
    const input = newDivWithClass('connector');
    inputsContainer.appendChild(input);

    input.addEventListener('click', e => {
      if (app.selectedBox == undefined || app.selectionIsInput) {
        app.clearSelection();
        app.selectedBox = box;
        app.selectedIndex = i;
        app.selectionIsInput = true;
        input.className += ' active';
        e.stopPropagation();
      } else if (!app.selectionIsInput) {
        box.addInputConnection(app.selectedBox, app.selectedIndex, i);
        app.clearSelection();
      }
    });

    if (i < inputs - 1) {
      const spacer = newDivWithClass('connectorSpacer');
      inputsContainer.appendChild(spacer);
    }
  }

  const outputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < outputs; i++) {
    const output = newDivWithClass('connector off');
    outputsContainer.appendChild(output);

    output.addEventListener('click', e => {
      e.stopPropagation();
      if (app.selectedBox == undefined || !app.selectionIsInput) {
        app.clearSelection();
        app.selectedBox = box;
        app.selectedIndex = i;
        app.selectionIsInput = false;
        output.className += ' active';
        e.stopPropagation();
      } else if (app.selectionIsInput) {
        app.selectedBox.addInputConnection(box, i, app.selectedIndex);
        app.clearSelection();
      }
    });
  }

  container.appendChild(inputsContainer);
  container.appendChild(outputsContainer);

  return container;
}

function newDivWithClass(className: string): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  return div;
}

function main() {
  // new 2in/1out canvas
  const c = new Canvas(2, 1);
  app.canvas = c;

  // create and add nand to canvas
  const n = new Nand();
  c.children.push(n);

  setupKeys();
}

function setupKeys() {
  window.addEventListener('keyup', e => {
    switch (e.key) {
      case 'Backspace': {
        app.deleteActiveConnections();
      }
      case 'Delete': {
        app.deleteActiveConnections();
      }
      case 'Escape': {
        app.clearSelection();
      }
    }
  });
}

const app = new App();
window.addEventListener('DOMContentLoaded', event => {
  main();
});
