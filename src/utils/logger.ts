import { LogLevel } from "../enums";

class ILog {
  prefix = "Pixiv Preview: ";
  LogLevel = {
    Verbose: 0,
    Info: 1,
    Warning: 2,
    Error: 3,
  };
  level = this.LogLevel.Warning;

  v(value: string) {
    if (this.level <= this.LogLevel.Verbose) {
      console.log(this.prefix + value);
    }
  }

  i(info: string) {
    if (this.level <= this.LogLevel.Info) {
      console.info(this.prefix + info);
    }
  }

  w(warning: string) {
    if (this.level <= this.LogLevel.Warning) {
      console.warn(this.prefix + warning);
    }
  }

  e(error: string) {
    if (this.level <= this.LogLevel.Error) {
      console.error(this.prefix + error);
    }
  }

  d(data: unknown) {
    if (this.level <= this.LogLevel.Verbose) {
      console.log(String(data));
    }
  }

  setLogLevel(logLevel) {
    this.level = logLevel;
  }
}
export const iLog = new ILog();

export function DoLog(level, msgOrElement) {
  if (level <= LogLevel.Error) {
    let prefix = "%c";
    let param = "";

    if (level == LogLevel.Error) {
      prefix += "[Error]";
      param = "color:#ff0000";
    } else if (level == LogLevel.Warning) {
      prefix += "[Warning]";
      param = "color:#ffa500";
    } else if (level == LogLevel.Info) {
      prefix += "[Info]";
      param = "color:#000000";
    } else if (level == LogLevel.Elements) {
      prefix += "Elements";
      param = "color:#000000";
    }

    if (level != LogLevel.Elements) {
      console.log(prefix + msgOrElement, param);
    } else {
      console.log(msgOrElement);
    }
  }
}
