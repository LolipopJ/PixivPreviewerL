interface UgoiraFrame {
  file: string;
  delay: number;
}

interface UgoiraMetadata {
  frames: UgoiraFrame[];
  mime_type?: string;
}

export interface ZipImagePlayerOptions {
  canvas: HTMLCanvasElement;
  metadata: UgoiraMetadata;
  autoStart?: boolean;
  debug?: boolean;
  source?: string;
  chunkSize?: number;
  autosize?: boolean;
  loop?: boolean;
}

interface ZipFileEntry {
  off: number;
  len: number;
}

interface ZipImagePlayerEventMap {
  frameLoaded: (frame: number) => void;
}

class ZipImagePlayer {
  canvas: HTMLCanvasElement;
  private op: ZipImagePlayerOptions;
  private _URL: typeof URL;
  private _maxLoadAhead: number;
  private _isSafari: boolean;
  private _loadingState: number;
  private _dead: boolean;
  private _context: CanvasRenderingContext2D;
  private _files: Record<string, ZipFileEntry>;
  private _frameCount: number;
  private _frame: number;
  private _loadFrame: number;
  private _frameImages: HTMLImageElement[];
  private _paused: boolean;
  private _loadTimer: ReturnType<typeof setTimeout> | null;
  private _timer: ReturnType<typeof setTimeout> | null;
  private _failed: boolean;
  private _len: number;
  private _buf: ArrayBuffer | null;
  private _bytes: Uint8Array | null;
  private _pHead: number;
  private _pNextHead: number;
  private _pFetch: number;
  private _pTail: number;
  private readonly _trailerBytes = 30000;
  private _listeners: Partial<ZipImagePlayerEventMap> = {};

  on<K extends keyof ZipImagePlayerEventMap>(
    event: K,
    handler: ZipImagePlayerEventMap[K]
  ): void {
    this._listeners[event] = handler;
  }

  off<K extends keyof ZipImagePlayerEventMap>(event: K): void {
    delete this._listeners[event];
  }

  private _emit<K extends keyof ZipImagePlayerEventMap>(
    event: K,
    ...args: Parameters<ZipImagePlayerEventMap[K]>
  ): void {
    const handler = this._listeners[event];
    if (handler) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }

  constructor(options: ZipImagePlayerOptions) {
    this.canvas = options.canvas;
    this.op = options;
    const w = window;
    this._URL = window.URL || w.webkitURL;
    this._maxLoadAhead = 0;
    if (!this._URL) {
      this._debugLog("No URL support! Will use slower data: URLs.");
      // Throttle loading to avoid making playback stalling completely while
      // loading images...
      this._maxLoadAhead = 10;
    }
    if (!window.Blob) {
      this._error("No Blob support");
    }
    if (!window.Uint8Array) {
      this._error("No Uint8Array support");
    }
    if (!window.DataView) {
      this._error("No DataView support");
    }
    if (!window.ArrayBuffer) {
      this._error("No ArrayBuffer support");
    }
    this._isSafari =
      Object.prototype.toString
        .call(window.HTMLElement)
        .indexOf("Constructor") > 0;
    this._loadingState = 0;
    this._dead = false;
    const context = options.canvas.getContext("2d");
    if (!context) {
      this._error("Failed to get 2D context");
    }
    this._context = context;
    this._files = {};
    this._frameCount = this.op.metadata.frames.length;
    this._debugLog("Frame count: " + this._frameCount);
    this._frame = 0;
    this._loadFrame = 0;
    this._frameImages = [];
    this._paused = false;
    this._loadTimer = null;
    this._timer = null;
    this._failed = false;
    this._len = 0;
    this._buf = null;
    this._bytes = null;
    this._pHead = 0;
    this._pNextHead = 0;
    this._pFetch = 0;
    this._pTail = 0;
    this._startLoad();
    if (this.op.autoStart) {
      this.play();
    } else {
      this._paused = true;
    }
  }

  private _mkerr(msg: string): () => void {
    return () => {
      this._error(msg);
    };
  }

  private _error(msg: string): never {
    this._failed = true;
    throw Error("ZipImagePlayer error: " + msg);
  }

  private _debugLog(msg: string): void {
    if (this.op.debug) {
      console.log(msg);
    }
  }

  private _load(
    offset: number | null,
    length: number | null,
    callback: ((off: number, len: number) => void) | null
  ): void {
    // Unfortunately JQuery doesn't support ArrayBuffer XHR
    const xhr = new XMLHttpRequest();
    xhr.addEventListener(
      "load",
      () => {
        if (this._dead) {
          return;
        }
        this._debugLog(
          "Load: " + offset + " " + length + " status=" + xhr.status
        );
        if (xhr.status == 200) {
          this._debugLog("Range disabled or unsupported, complete load");
          offset = 0;
          length = (xhr.response as ArrayBuffer).byteLength;
          this._len = length;
          this._buf = xhr.response as ArrayBuffer;
          this._bytes = new Uint8Array(this._buf);
        } else {
          if (xhr.status != 206) {
            this._error("Unexpected HTTP status " + xhr.status);
          }
          if ((xhr.response as ArrayBuffer).byteLength != length) {
            this._error(
              "Unexpected length " +
                (xhr.response as ArrayBuffer).byteLength +
                " (expected " +
                length +
                ")"
            );
          }
          this._bytes!.set(
            new Uint8Array(xhr.response as ArrayBuffer),
            offset!
          );
        }
        if (callback) {
          callback(offset!, length!);
        }
      },
      false
    );
    xhr.addEventListener("error", this._mkerr("Fetch failed"), false);
    xhr.open("GET", this.op.source!);
    xhr.responseType = "arraybuffer";
    if (offset != null && length != null) {
      const end = offset + length;
      xhr.setRequestHeader("Range", "bytes=" + offset + "-" + (end - 1));
      if (this._isSafari) {
        // Range request caching is broken in Safari
        // https://bugs.webkit.org/show_bug.cgi?id=82672
        xhr.setRequestHeader("Cache-control", "no-cache");
        xhr.setRequestHeader("If-None-Match", Math.random().toString());
      }
    }
    // this._debugLog("Load: " + offset + " " + length);
    xhr.send();
  }

  private _startLoad(): void {
    if (!this.op.source) {
      // Unpacked mode (individiual frame URLs) - just load the frames.
      this._loadNextFrame();
      return;
    }
    $.ajax({
      url: this.op.source,
      type: "HEAD",
    })
      .done((_data: unknown, _status: string, xhr: JQuery.jqXHR) => {
        if (this._dead) {
          return;
        }
        this._pHead = 0;
        this._pNextHead = 0;
        this._pFetch = 0;
        const len = parseInt(String(xhr.getResponseHeader("Content-Length")));
        if (!len) {
          this._debugLog("HEAD request failed: invalid file length.");
          this._debugLog("Falling back to full file mode.");
          this._load(null, null, (_off, fullLen) => {
            this._pTail = 0;
            this._pHead = fullLen;
            this._findCentralDirectory();
          });
          return;
        }
        this._debugLog("Len: " + len);
        this._len = len;
        this._buf = new ArrayBuffer(len);
        this._bytes = new Uint8Array(this._buf);
        let off = len - this._trailerBytes;
        if (off < 0) {
          off = 0;
        }
        this._pTail = len;
        this._load(off, len - off, (loadedOff) => {
          this._pTail = loadedOff;
          this._findCentralDirectory();
        });
      })
      .fail(this._mkerr("Length fetch failed"));
  }

  private _findCentralDirectory(): void {
    // No support for ZIP file comment
    const dv = new DataView(this._buf!, this._len - 22, 22);
    if (dv.getUint32(0, true) != 0x06054b50) {
      this._error("End of Central Directory signature not found");
    }
    const cd_count = dv.getUint16(10, true);
    const cd_size = dv.getUint32(12, true);
    const cd_off = dv.getUint32(16, true);
    if (cd_off < this._pTail) {
      this._load(cd_off, this._pTail - cd_off, () => {
        this._pTail = cd_off;
        this._readCentralDirectory(cd_off, cd_size, cd_count);
      });
    } else {
      this._readCentralDirectory(cd_off, cd_size, cd_count);
    }
  }

  private _readCentralDirectory(
    offset: number,
    size: number,
    count: number
  ): void {
    const dv = new DataView(this._buf!, offset, size);
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) != 0x02014b50) {
        this._error("Invalid Central Directory signature");
      }
      const compMethod = dv.getUint16(p + 10, true);
      const uncompSize = dv.getUint32(p + 24, true);
      const nameLen = dv.getUint16(p + 28, true);
      const extraLen = dv.getUint16(p + 30, true);
      const cmtLen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      if (compMethod != 0) {
        this._error("Unsupported compression method");
      }
      p += 46;
      const nameView = new Uint8Array(this._buf!, offset + p, nameLen);
      let name = "";
      for (let j = 0; j < nameLen; j++) {
        name += String.fromCharCode(nameView[j]);
      }
      p += nameLen + extraLen + cmtLen;
      //this._debugLog("File: " + name + " (" + uncompSize + " bytes @ " + off + ")");
      this._files[name] = { off: off, len: uncompSize };
    }
    // Two outstanding fetches at any given time.
    // Note: the implementation does not support more than two.
    if (this._pHead >= this._pTail) {
      this._pHead = this._len;
      $(this as unknown as JQuery.PlainObject).triggerHandler("loadProgress", [
        this._pHead / this._len,
      ]);
      this._loadNextFrame();
    } else {
      this._loadNextChunk();
      this._loadNextChunk();
    }
  }

  private _loadNextChunk(): void {
    if (this._pFetch >= this._pTail) {
      return;
    }
    const off = this._pFetch;
    let len = this.op.chunkSize!;
    if (this._pFetch + len > this._pTail) {
      len = this._pTail - this._pFetch;
    }
    this._pFetch += len;
    this._load(off, len, (loadedOff, loadedLen) => {
      if (loadedOff == this._pHead) {
        if (this._pNextHead) {
          this._pHead = this._pNextHead;
          this._pNextHead = 0;
        } else {
          this._pHead = loadedOff + loadedLen;
        }
        if (this._pHead >= this._pTail) {
          this._pHead = this._len;
        }
        // this._debugLog("New pHead: " + this._pHead);
        $(this as unknown as JQuery.PlainObject).triggerHandler(
          "loadProgress",
          [this._pHead / this._len]
        );
        if (!this._loadTimer) {
          this._loadNextFrame();
        }
      } else {
        this._pNextHead = loadedOff + loadedLen;
      }
      this._loadNextChunk();
    });
  }

  private _fileDataStart(offset: number): number {
    const dv = new DataView(this._buf!, offset, 30);
    const nameLen = dv.getUint16(26, true);
    const extraLen = dv.getUint16(28, true);
    return offset + 30 + nameLen + extraLen;
  }

  private _isFileAvailable(name: string): boolean {
    const info = this._files[name];
    if (!info) {
      this._error("File " + name + " not found in ZIP");
    }
    if (this._pHead < info.off + 30) {
      return false;
    }
    return this._pHead >= this._fileDataStart(info.off) + info.len;
  }

  private _loadNextFrame(): void {
    if (this._dead) {
      return;
    }
    const frame = this._loadFrame;
    if (frame >= this._frameCount) {
      return;
    }
    const meta = this.op.metadata.frames[frame];
    if (!this.op.source) {
      // Unpacked mode (individiual frame URLs)
      this._loadFrame += 1;
      this._loadImage(frame, meta.file, false);
      return;
    }
    if (!this._isFileAvailable(meta.file)) {
      return;
    }
    this._loadFrame += 1;
    const off = this._fileDataStart(this._files[meta.file].off);
    const end = off + this._files[meta.file].len;
    let url: string;
    const mime_type = this.op.metadata.mime_type ?? "image/png";
    if (this._URL) {
      let slice: ArrayBuffer;
      if (!this._buf!.slice) {
        slice = new ArrayBuffer(this._files[meta.file].len);
        const view = new Uint8Array(slice);
        view.set(this._bytes!.subarray(off, end));
      } else {
        slice = this._buf!.slice(off, end);
      }
      const blob = new Blob([slice], { type: mime_type });
      // _this._debugLog("Loading " + meta.file + " to frame " + frame);
      url = this._URL.createObjectURL(blob);
      this._loadImage(frame, url, true);
    } else {
      url =
        "data:" +
        mime_type +
        ";base64," +
        base64ArrayBuffer(this._buf!, off, end - off);
      this._loadImage(frame, url, false);
    }
  }

  private _loadImage(frame: number, url: string, isBlob: boolean): void {
    const image = new Image();
    const meta = this.op.metadata.frames[frame];
    image.addEventListener("load", () => {
      this._debugLog("Loaded " + meta.file + " to frame " + frame);
      if (isBlob) {
        this._URL.revokeObjectURL(url);
      }
      if (this._dead) {
        return;
      }
      this._frameImages[frame] = image;
      this._emit("frameLoaded", frame);
      if (this._loadingState == 0) {
        this._displayFrame();
      }
      if (frame >= this._frameCount - 1) {
        this._setLoadingState(2);
        this._buf = null;
        this._bytes = null;
      } else {
        if (!this._maxLoadAhead || frame - this._frame < this._maxLoadAhead) {
          this._loadNextFrame();
        } else if (!this._loadTimer) {
          this._loadTimer = setTimeout(() => {
            this._loadTimer = null;
            this._loadNextFrame();
          }, 200);
        }
      }
    });
    image.src = url;
  }

  private _setLoadingState(state: number): void {
    if (this._loadingState != state) {
      this._loadingState = state;
      $(this as unknown as JQuery.PlainObject).triggerHandler(
        "loadingStateChanged",
        [state]
      );
    }
  }

  private _displayFrame(): void {
    if (this._dead) {
      return;
    }
    const meta = this.op.metadata.frames[this._frame];
    this._debugLog("Displaying frame: " + this._frame + " " + meta.file);
    const image = this._frameImages[this._frame];
    if (!image) {
      this._debugLog("Image not available!");
      this._setLoadingState(0);
      return;
    }
    if (this._loadingState != 2) {
      this._setLoadingState(1);
    }
    if (this.op.autosize) {
      if (
        this._context.canvas.width != image.width ||
        this._context.canvas.height != image.height
      ) {
        // make the canvas autosize itself according to the images drawn on it
        // should set it once, since we don't have variable sized frames
        this._context.canvas.width = image.width;
        this._context.canvas.height = image.height;
      }
    }
    this._context.clearRect(0, 0, this.op.canvas.width, this.op.canvas.height);
    this._context.drawImage(image, 0, 0);
    $(this as unknown as JQuery.PlainObject).triggerHandler(
      "frame",
      this._frame
    );
    if (!this._paused) {
      this._timer = setTimeout(() => {
        this._timer = null;
        this._nextFrame();
      }, meta.delay);
    }
  }

  private _nextFrame(): void {
    if (this._frame >= this._frameCount - 1) {
      if (this.op.loop) {
        this._frame = 0;
      } else {
        this.pause();
        return;
      }
    } else {
      this._frame += 1;
    }
    this._displayFrame();
  }

  play(): void {
    if (this._dead) {
      return;
    }
    if (this._paused) {
      $(this as unknown as JQuery.PlainObject).triggerHandler("play", [
        this._frame,
      ]);
      this._paused = false;
      this._displayFrame();
    }
  }

  pause(): void {
    if (this._dead) {
      return;
    }
    if (!this._paused) {
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._paused = true;
      $(this as unknown as JQuery.PlainObject).triggerHandler("pause", [
        this._frame,
      ]);
    }
  }

  rewind(): void {
    if (this._dead) {
      return;
    }
    this._frame = 0;
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._displayFrame();
  }

  stop(): void {
    this._debugLog("Stopped!");
    this._dead = true;
    if (this._timer) {
      clearTimeout(this._timer);
    }
    if (this._loadTimer) {
      clearTimeout(this._loadTimer);
    }
    this._frameImages = [];
    this._buf = null;
    this._bytes = null;
    $(this as unknown as JQuery.PlainObject).triggerHandler("stop");
  }

  getCurrentFrame(): number {
    return this._frame;
  }

  getLoadedFrameImages(): HTMLImageElement[] {
    return this._frameImages;
  }

  getLoadedFrames(): number {
    return this._frameImages.length;
  }

  getFrameCount(): number {
    return this._frameCount;
  }

  hasError(): boolean {
    return this._failed;
  }
}

// Required for iOS <6, where Blob URLs are not available. This is slow...
// Source: https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(
  arrayBuffer: ArrayBuffer,
  off: number,
  byteLength: number
): string {
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const byteRemainder = byteLength % 3;
  const mainLength = off + byteLength - byteRemainder;
  let a, b, c, d;
  let chunk;
  // Main loop deals with bytes in chunks of 3
  for (let i = off; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
}

export default ZipImagePlayer;
