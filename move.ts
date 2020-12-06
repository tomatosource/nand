export class Move {
  ele?: HTMLElement;
	onMove: ()=>void;

  constructor(ele: HTMLElement, onMove: ()=>void) {
    this.ele = ele;
		this.onMove = onMove;
    this.ele.onmousedown = () => {
      document.onmouseup = () => {
        this.ele.onmousemove = undefined;
      };

      this.ele.onmousemove = (e: MouseEvent) => {
        this.ele.style.left = `${e.pageX - 50}px`;
        this.ele.style.top = `${e.pageY - 50}px`;
				this.onMove();
        // TODO if drag stop e prop of mouse click?
      };
    };
  }
}
