export class Line {
  startEle: Element;
  endEle: Element;
	line: Element;

  constructor(start: Element, end: Element) {
    this.startEle = start;
    this.endEle = end;
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
    newLine.setAttribute('x1', `${start.x}`);
    newLine.setAttribute('y1', `${ start.height/2 + start.top}`);
    newLine.setAttribute('x2', `${end.x}`);
    newLine.setAttribute('y2', `${end.y + end.height/2}`);

    newLine.setAttribute('stroke', 'black');
		if (this.line !== undefined) {
			this.line.remove();
		}
		this.line = newLine;
    document.getElementById('lines').append(newLine);
  }

	setColor(c: string) {
		console.log(c);
	}

	remove() {
		this.line.remove();
	}
}
