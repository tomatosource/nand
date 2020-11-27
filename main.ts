import { IBox } from './interface';
import { setOutputDom, setInputDom, buildBoxHTML } from './utils';
import { Nand, SourceSwitch, Indicator } from './atoms';
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

    this.selectedBox.clearSelection(this.selectionIsInput, this.selectedIndex);

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
  line?: LeaderLine;
  rendered: boolean;

  constructor(
    sourceBox: IBox,
    sourceIndex: number,
    destinationBox: IBox,
    destinationIndex: number,
    initValue: boolean,
    rendered: boolean,
  ) {
    this.id = (Math.random() + 1).toString(36).substring(7);
    this.sourceBox = sourceBox;
    this.sourceIndex = sourceIndex;
    this.destinationBox = destinationBox;
    this.destinationIndex = destinationIndex;
    this.rendered = rendered;

    destinationBox.setInput(destinationIndex, initValue);

    if (rendered) {
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
}

class Canvas {
  app: App;
  children: IBox[];

  constructor(app: App) {
    this.app = app;
    this.children = [];
  }

  remove(box: IBox) {
		box.clean();
    const id = box.id;

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
        app.canvas.children.push(new Nand(app, true));
        break;
      }
      case 'i': {
        app.canvas.children.push(new SourceSwitch(app, true));
        break;
      }
      case 'o': {
        app.canvas.children.push(new Indicator(app, true));
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
