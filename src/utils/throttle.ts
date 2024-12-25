function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let locked = false;

  return function (...args: Parameters<T>) {
    if (locked) return;
    locked = true;
    setTimeout(() => {
      locked = false;
    }, delay);
    func.apply(this, args);
  };
}

export default throttle;
