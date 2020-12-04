export class Move {
  ele?: HTMLElement;

  constructor(ele: HTMLElement) {
    this.ele = ele;
    this.ele.onmousedown = () => {
      document.onmouseup = () => {
        this.ele.onmousemove = undefined;
      };

      this.ele.onmousemove = (e: MouseEvent) => {
        this.ele.style.left = `${e.pageX - 50}px`;
        this.ele.style.top = `${e.pageY - 50}px`;
        // TODO if drag stop e prop of mouse click?
      };
    };
  }
}
