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
  trailerBytes?: number;
  autosize?: boolean;
  loop?: boolean;
  /**
   * 逐帧交出解包后的帧数据，用于写入帧缓存。
   * 未提供 `source`（散装帧模式）时不调用。
   */
  onFrameDecoded?: (frame: UgoiraDecodedFrame) => void;
  /**
   * 已缓存的帧数据，按 `metadata.frames` 的顺序提供。
   * 提供且长度匹配时直接播放缓存帧，跳过 zip 下载与解包。
   */
  cachedFrames?: Blob[] | null;
}

export interface UgoiraDecodedFrame {
  index: number;
  file: string;
  delay: number;
  blob: Blob;
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
  private _loadingState: number;
  private _dead: boolean;
  private _context: CanvasRenderingContext2D;
  private _files: Record<string, ZipFileEntry>;
  private _frameCount: number;
  private _frame: number;
  private _loadFrame: number;
  private _frameImages: HTMLImageElement[];
  private _paused: boolean;
  private _timer: ReturnType<typeof setTimeout> | null;
  private _failed: boolean;
  private _len: number;
  private _buf: ArrayBuffer | null;
  private _pHead: number;
  private _pNextHead: number;
  private _pFetch: number;
  private _pTail: number;
  private readonly _trailerBytes: number;
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
    this._trailerBytes = Math.max(
      22,
      Math.floor(options.trailerBytes ?? 30000)
    );
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
    this._timer = null;
    this._failed = false;
    this._len = 0;
    this._buf = null;
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
          new Uint8Array(this._buf!).set(
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
    }
    // this._debugLog("Load: " + offset + " " + length);
    xhr.send();
  }

  private _startLoad(): void {
    // 命中帧缓存时直接解码播放，跳过 zip 下载与解包
    if (this.op.cachedFrames?.length === this._frameCount) {
      this._debugLog("Use cached frames.");
      this._loadCachedFrame();
      return;
    }
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
    let len = this.op.chunkSize ?? 300000;
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
        this._loadNextFrame();
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
    // 命中帧缓存时优先从缓存加载
    if (this.op.cachedFrames?.length === this._frameCount) {
      this._loadCachedFrame();
      return;
    }
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
    const mime_type = this.op.metadata.mime_type ?? "image/png";
    const slice = this._buf!.slice(off, end);
    const blob = new Blob([slice], { type: mime_type });
    this.op.onFrameDecoded?.({
      index: frame,
      file: meta.file,
      delay: meta.delay,
      blob,
    });
    const url = URL.createObjectURL(blob);
    this._loadImage(frame, url, true);
  }

  /** 从帧缓存中加载下一帧 */
  private _loadCachedFrame(): void {
    if (this._dead) {
      return;
    }
    const frame = this._loadFrame;
    if (frame >= this._frameCount) {
      return;
    }
    this._loadFrame += 1;
    const blob = this.op.cachedFrames![frame];
    this._loadImage(frame, URL.createObjectURL(blob), true);
  }

  private _loadImage(frame: number, url: string, isBlob: boolean): void {
    const image = new Image();
    const meta = this.op.metadata.frames[frame];
    image.addEventListener("load", () => {
      this._debugLog("Loaded " + meta.file + " to frame " + frame);
      if (isBlob) {
        URL.revokeObjectURL(url);
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
      } else {
        this._loadNextFrame();
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
    this._frameImages = [];
    this._buf = null;
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

export default ZipImagePlayer;
