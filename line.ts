export class Line {
  startEle: Element;
  endEle: Element;
  line: Element;
  on: boolean;

  constructor(start: Element, end: Element, init: boolean) {
    this.startEle = start;
    this.endEle = end;
    this.on = init;
    this.update();
  }

  update() {
    let newLine = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );

    newLine.setAttribute('stroke-width', '1');
    newLine.setAttribute('stroke', this.on ? '#10a9a9' : 'grey');

    const start = this.startEle.getBoundingClientRect();
    const end = this.endEle.getBoundingClientRect();
    let x1 = start.x + start.width;
    let y1 = start.y + start.height / 2;
    let x2 = end.x;
    let y2 = end.y + start.height / 2;
    let midX = (x1 + x2) / 2;
    let midY = lerp(y1, y2, 0.5);
    let xBuffer = 24;
    let yBuffer = 48;

    if (x1 > x2) {
      if (y1 > y2) {
        newLine.setAttributeNS(
          null,
          'd',
          `M ${x1} ${y1} L ${x1 + xBuffer} ${y1} ${x1 + xBuffer} ${
            midY + yBuffer
          } ${x2 - xBuffer} ${midY - yBuffer} ${
            x2 - xBuffer
          } ${y2} ${x2} ${y2}`,
        );
      } else {
        newLine.setAttributeNS(
          null,
          'd',
          `M ${x1} ${y1} L ${x1 + xBuffer} ${y1} ${x1 + xBuffer} ${
            midY - yBuffer
          } ${x2 - xBuffer} ${midY + yBuffer} ${
            x2 - xBuffer
          } ${y2} ${x2} ${y2}`,
        );
      }
    } else {
      newLine.setAttributeNS(
        null,
        'd',
        `M ${x1} ${y1} L${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`,
      );
    }

    if (this.line !== undefined) {
      this.line.remove();
    }

    document.getElementById('lines').append(newLine);
    this.line = newLine;
  }

  setColor(c: string) {
    if (this.line) {
      this.line.setAttribute('stroke', c);
    }
  }

  remove() {
    if (this.line) {
      this.line.remove();
    }
  }
}

function lerp(v0: number, v1: number, t: number): number {
  return v0 * (1 - t) + v1 * t;
}
