import { App, Connection } from './main';
import PlainDraggable from 'plain-draggable';

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
}
