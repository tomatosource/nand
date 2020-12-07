export class Move {
  ele?: HTMLElement;
  onMove: () => void;
  offX: number;
  offY: number;
  moved: boolean;

  constructor(ele: HTMLElement, onMove: () => void) {
    this.ele = ele;
    this.onMove = onMove;
    this.moved = false;

    this.ele.onmousedown = (ee: MouseEvent) => {
      let rect = this.ele.getBoundingClientRect();
      this.offX = ee.x - rect.x;
      this.offY = ee.y - rect.y;

      document.onmouseup = (eee: MouseEvent) => {
        if (this.moved) {
          eee.stopPropagation();
        }
        this.moved = false;
        document.onmousemove = undefined;
      };

      document.onmousemove = (e: MouseEvent) => {
        this.moved = true;
        this.ele.style.left = `${snappy(e.pageX - this.offX)}px`;
        this.ele.style.top = `${snappy(e.pageY - this.offY)}px`;
        this.onMove();
      };
    };
  }
}

function snappy(n: number): number {
  return n - (n % 16);
}
