import { App, Connection } from './main';
import PlainDraggable from 'plain-draggable';

export interface IBox {
  id: string;
  ele: HTMLElement;
  draggable: PlainDraggable;

  setInput(i: number, v: boolean): void;
  getOutputState(i: number): boolean;
  getInputState(i: number): boolean;
  addInputConnection(
    sourceBox: IBox,
    sourceIndex: number,
    inputIndex: number,
  ): boolean;
  addOutputConnection(connection: Connection, index: number): void;
  removeInputConnection(index: number): void;
  removeOutputConnection(index: number, id: string): void;
  clearOutput(index: number): void;
  removeAllConnections(): void;
	getInputCount(): number;
	getOutputCount(): number;
}

// class BlackBox implements IBox {
  // id: string;
  // ele: HTMLElement;
  // draggable: PlainDraggable;

  // constructor(app: App, children: IBox[]) {
    // this.id = (Math.random() + 1).toString(36).substring(7);
    // this.inputs = [false, false];
    // this.inputConnections = [];
    // this.outputs = [[]];
    // this.state = true;

    // const canvasDiv = document.getElementById('canvas');
    // this.ele = buildBoxHTML(app, this, 2, 1, 'NAND');
    // canvasDiv.appendChild(this.ele);
    // setOutputDom(this.ele, 0, this.state);
    // this.draggable = new PlainDraggable(this.ele);
    // this.draggable.snap = { step: 45 };
    // // on drag sync up lines
    // this.draggable.onMove = () => {
      // this.inputConnections.forEach(c => {
        // if (c && c.line) {
          // c.line.position();
        // }
      // });
      // this.outputs.forEach(o => {
        // o.forEach(c => {
          // if (c && c.line) {
            // c.line.position();
          // }
        // });
      // });
    // };
  // }

  // setInput(i: number, v: boolean): void;
  // getOutputState(i: number): boolean;
  // getInputState(i: number): boolean;
  // addInputConnection(
    // sourceBox: IBox,
    // sourceIndex: number,
    // inputIndex: number,
  // ): boolean;
  // addOutputConnection(connection: Connection, index: number): void;
  // removeInputConnection(index: number): void;
  // removeOutputConnection(index: number, id: string): void;
  // clearOutput(index: number): void;
  // removeAllConnections(): void;
// }
