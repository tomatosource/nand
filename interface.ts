import { Connection } from './connection';

export interface IBox {
  id: string;
  rendered: boolean;
  ele?: HTMLElement;

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
  clean(): void;
  clearSelection(isInput: boolean, selectedIndex: number): void;
  getNode(): N;
  getEdges(): E[];
}

export interface G {
  nodes: N[];
  edges: E[];
}

export interface E {
  n1: string;
  n1Index: number;
  n2: string;
  n2Index: number;
}

export enum AtomType {
  BB,
  NAND,
  I,
  O,
  // C,
  // ON,
  // OFF,
}

export interface N {
  id: string;
  innerG?: G;
  kind: AtomType;
  label: string;
}

export class InputConnection {
  box: IBox;
  index: number;

  constructor(box: IBox, index: number) {
    this.box = box;
    this.index = index;
  }
}
