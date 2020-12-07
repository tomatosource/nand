import { G, N, E, InputConnection, IBox } from './interface';
import { Line } from './line';

export class Connection {
  id: string;
  sourceBox: IBox;
  sourceIndex: number;
  destinationBox: IBox;
  destinationIndex: number;
  line?: Line;
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
      this.line = new Line(
        sourceConns[sourceIndex],
        destConns[destinationIndex],
        sourceBox.getOutputState(sourceIndex),
      );
    }
  }

  update() {
    if (this.line) {
      this.line.update();
    }
  }

  on() {
    if (this.line) {
      this.line.setColor('#10a9a9');
    }
  }

  off() {
    if (this.line) {
      this.line.setColor('grey');
    }
  }
}
