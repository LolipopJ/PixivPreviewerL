import { LogLevel } from "../enums";

class ILog {
  prefix = "%c Pixiv Preview";

  v(...values: unknown[]) {
    console.log(
      this.prefix + " [VERBOSE] ",
      "color:#333 ;background-color: #fff",
      ...values
    );
  }

  i(...infos: unknown[]) {
    console.info(
      this.prefix + " [INFO] ",
      "color:#333 ;background-color: #fff;",
      ...infos
    );
  }

  w(...warnings: unknown[]) {
    console.warn(
      this.prefix + " [WARNING] ",
      "color:#111 ;background-color:#ffa500;",
      ...warnings
    );
  }

  e(...errors: unknown[]) {
    console.error(
      this.prefix + " [ERROR] ",
      "color:#111 ;background-color:#ff0000;",
      ...errors
    );
  }

  d(...data: unknown[]) {
    console.log(
      this.prefix + " [DATA] ",
      "color:#333 ;background-color: #fff;",
      ...data
    );
  }
}
export const iLog = new ILog();

export function DoLog(level = LogLevel.Info, ...msgOrElement: unknown[]) {
  switch (level) {
    case LogLevel.Error:
      iLog.e(...msgOrElement);
      break;
    case LogLevel.Warning:
      iLog.w(...msgOrElement);
      break;
    case LogLevel.Info:
      iLog.i(...msgOrElement);
      break;
    case LogLevel.Elements:
    case LogLevel.None:
    default:
      iLog.v(...msgOrElement);
  }
}
