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

    newLine.setAttribute('stroke-width', '2');
    newLine.setAttribute('stroke', this.on ? 'red' : 'grey');

    const start = this.startEle.getBoundingClientRect();
    const end = this.endEle.getBoundingClientRect();
    let x1 = start.x + start.width;
    let y1 = start.height / 2 + start.top;
    let x2 = end.x;
    let y2 = end.y + end.height / 2;
    let midX = (x1 + x2) / 2;

    newLine.setAttributeNS(
      null,
      'd',
      `M ${x1} ${y1} L${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`,
    );

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
