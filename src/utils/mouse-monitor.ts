class MouseMonitor {
  /** 鼠标相对网页的位置 */
  mousePos: [number, number] = [0, 0];
  /** 鼠标相对视窗的绝对位置 */
  mouseAbsPos: [number, number] = [0, 0];

  constructor() {
    document.addEventListener("mousemove", (mouseMoveEvent) => {
      this.mousePos = [mouseMoveEvent.pageX, mouseMoveEvent.pageY];
      this.mouseAbsPos = [mouseMoveEvent.clientX, mouseMoveEvent.clientY];
    });
  }
}

const mouseMonitor = new MouseMonitor();

export default mouseMonitor;
