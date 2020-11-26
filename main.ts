import LeaderLine  from 'leader-line';

interface IBox {
	ele: HTMLElement;
  setInput(i: number, v: boolean): void;
  getOutputState(i: number): boolean;
}

class Connection {
  sourceBox: IBox;
  sourceIndex: number;
  destinationBox: IBox;
  destinationIndex: number;

  constructor(
    sourceBox: IBox,
    sourceIndex: number,
    destinationBox: IBox,
    destinationIndex: number,
    initValue: boolean,
  ) {
    this.sourceBox = sourceBox;
    this.sourceIndex = sourceIndex;
    this.destinationBox = destinationBox;
    this.destinationIndex = destinationIndex;

    const sourceIOContainers = sourceBox.ele.querySelectorAll('.ioContainer');
    const sourceConns = sourceIOContainers[1].querySelectorAll('.connector');
    const destIOContainers = destinationBox.ele.querySelectorAll('.ioContainer');
    const destConns = destIOContainers[0].querySelectorAll('.connector');
    new LeaderLine(sourceConns[sourceIndex], destConns[destinationIndex]);
  }
}

class Box implements IBox {
  inputs: boolean[];
  inputEles: HTMLElement[];
	ele: HTMLElement;

  inputConnections: Connection[][];
  outputs: Connection[][];
  outputStates: boolean[];

  constructor(inputCount: number, outputCount: number) {
    this.inputs = Array.apply(null, new Array(inputCount)).map(() => false);
    this.inputConnections = Array.apply(null, new Array(inputCount)).map(
      () => [],
    );
    this.outputs = Array.apply(null, new Array(outputCount)).map(() => []);
    this.outputStates = Array.apply(null, new Array(outputCount)).map(
      () => false,
    );

    const canvasDiv = document.getElementById('canvas');
    this.ele = buildBoxHTML(inputCount, outputCount, '');
    canvasDiv.appendChild(this.ele);
  }

  getOutputState(i: number): boolean {
    return this.outputStates[i];
  }

  setInput(i: number, v: boolean): void {
    if (this.inputs[i] != v) {
      this.inputs[i] = v;
      this.inputConnections[i].forEach(c => {
        c.destinationBox.setInput(c.destinationIndex, v);
      });
    }
  }
}

class Nand implements IBox {
  inputs: boolean[];
  outputs: Connection[][];
  ele: HTMLElement;
  state: boolean;

  constructor() {
    this.inputs = [false, false];
    this.outputs = [[]];
    this.state = true;

    const canvasDiv = document.getElementById('canvas');
    this.ele = buildBoxHTML(2, 1, 'NAND');
    canvasDiv.appendChild(this.ele);
    setOutputDom(this.ele, 0, this.state);
  }

  getOutputState(_: number): boolean {
    return this.state;
  }

  setInput(i: number, v: boolean): void {
    if (this.inputs[i] != v) {
      this.inputs[i] = v;
      const newState = !(this.inputs[0] && this.inputs[1]);
      setInputDom(this.ele, i, v);
      if (this.state != newState) {
        this.state = newState;
        setOutputDom(this.ele, 0, this.state);

        this.outputs[0].forEach(o => {
          o.destinationBox.setInput(o.destinationIndex, this.state);
        });
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
    this.ele = buildBoxHTML(0, 1, 'SS');

    this.ele.addEventListener('click', e => this.toggle(e));
    this.ele.className = 'box switch';
    switchesContainer.appendChild(this.ele);
  }

  getOutputState(_: number): boolean {
    return this.state;
  }

  setInput(_: number, v: boolean): void {
    if (this.state != v) {
      this.state = v;
      this.outputs.forEach(o => {
        o.destinationBox.setInput(o.destinationIndex, v);
      });
      setOutputDom(this.ele, 0, v);
    }
  }

  toggle(e: MouseEvent): void {
    this.setInput(0, !this.state);
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

  constructor() {
    this.state = false;

    const switchesContainer = document.getElementById('indicatorsContainer');
    this.ele = buildBoxHTML(1, 0, '');
    switchesContainer.appendChild(this.ele);
  }

  getOutputState(_: number): boolean {
    return this.state;
  }

  setInput(i: number, v: boolean): void {
    if (v != this.state) {
      this.state = v;
      setInputDom(this.ele, i, v);
    }
  }
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
  inputs: number,
  outputs: number,
  label: string,
): HTMLElement {
  const container = newDivWithClass('box');

  const inputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < inputs; i++) {
    const input = newDivWithClass('connector');
    inputsContainer.appendChild(input);

    if (i < inputs - 1) {
      const spacer = newDivWithClass('connectorSpacer');
      inputsContainer.appendChild(spacer);
    }
  }

  const outputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < outputs; i++) {
    const output = newDivWithClass('connector off');
    outputsContainer.appendChild(output);
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

  // create and add nand to canvas
  const n = new Nand();
  c.children.push(n);

  // wire up canvas switches to nand inputs
  c.inputs[0].outputs.push(
    new Connection(c.inputs[0], 0, n, 0, c.inputs[0].getOutputState(0)),
  );
  c.inputs[1].outputs.push(
    new Connection(c.inputs[1], 0, n, 1, c.inputs[1].getOutputState(0)),
  );

  // wire up nand output to canvas indicator
  n.outputs[0].push(new Connection(n, 0, c.outputs[0], 0, n.getOutputState(0)));
}

window.addEventListener('DOMContentLoaded', event => {
  main();
});
