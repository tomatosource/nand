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
      'line',
    );

    const start = this.startEle.getBoundingClientRect();
    const end = this.endEle.getBoundingClientRect();

    newLine.setAttribute('id', 'line2');
    newLine.setAttribute('x1', `${start.x + start.width}`);
    newLine.setAttribute('y1', `${start.height / 2 + start.top}`);
    newLine.setAttribute('x2', `${end.x}`);
    newLine.setAttribute('y2', `${end.y + end.height / 2}`);

		const c = this.on ? 'red' : 'grey';
    newLine.setAttribute('stroke', c);
    if (this.line !== undefined) {
      this.line.remove();
    }
    this.line = newLine;
    document.getElementById('lines').append(newLine);
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
