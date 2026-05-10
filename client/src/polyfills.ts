/* Polyfills for iOS 12, Samsung 2017, Chrome 70 */

// ResizeObserver — not in iOS < 13.4
if (typeof ResizeObserver === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ResizeObserver: RO } = require("@juggle/resize-observer");
  (window as any).ResizeObserver = RO;
}


// MediaQueryList.addEventListener — iOS < 14 uses addListener/removeListener instead
if (typeof window !== "undefined" && window.matchMedia) {
  try {
    const testMql = window.matchMedia("(min-width: 0px)");
    if (testMql && typeof testMql.addEventListener !== "function") {
      const _orig = window.matchMedia.bind(window);
      (window as any).matchMedia = function (query: string) {
        const mql: any = _orig(query);
        if (mql && typeof mql.addEventListener !== "function") {
          mql.addEventListener = function (_type: string, listener: EventListenerOrEventListenerObject) {
            return mql.addListener(typeof listener === "function" ? listener : (listener as EventListenerObject).handleEvent.bind(listener));
          };
          mql.removeEventListener = function (_type: string, listener: EventListenerOrEventListenerObject) {
            return mql.removeListener(typeof listener === "function" ? listener : (listener as EventListenerObject).handleEvent.bind(listener));
          };
        }
        return mql;
      };
    }
  } catch (_) {
    // ignore
  }
}

if (!Array.prototype.flat) {
  // eslint-disable-next-line no-extend-native
  (Array.prototype as any).flat = function (depth?: number) {
    depth = depth === undefined ? 1 : Math.floor(depth as number);
    return (function flat(arr: any[], d: number): any[] {
      return arr.reduce(function (acc: any[], val: any) {
        return acc.concat(Array.isArray(val) && d > 0 ? flat(val, d - 1) : val);
      }, []);
    })(this, depth);
  };
}

if (!Array.prototype.flatMap) {
  // eslint-disable-next-line no-extend-native
  (Array.prototype as any).flatMap = function (callback: any, thisArg?: any) {
    return Array.prototype.map.call(this, callback, thisArg).reduce(function (acc: any[], val: any) {
      return acc.concat(val);
    }, []);
  };
}

if (!Object.fromEntries) {
  (Object as any).fromEntries = function (entries: any) {
    return Array.from(entries as any[]).reduce(function (obj: any, pair: any) {
      obj[pair[0]] = pair[1];
      return obj;
    }, {});
  };
}

if (!String.prototype.replaceAll) {
  // eslint-disable-next-line no-extend-native
  String.prototype.replaceAll = function (search: any, replace: any) {
    return this.split(search).join(replace);
  };
}

if (!Promise.allSettled) {
  (Promise as any).allSettled = function (promises: any[]) {
    return Promise.all(
      promises.map(function (p: any) {
        return Promise.resolve(p)
          .then(function (value: any) { return { status: "fulfilled", value }; })
          .catch(function (reason: any) { return { status: "rejected", reason }; });
      })
    );
  };
}

if (typeof (window as any).queueMicrotask === "undefined") {
  (window as any).queueMicrotask = function (fn: () => void) {
    Promise.resolve().then(fn);
  };
}

if (typeof globalThis === "undefined") {
  (window as any).globalThis = window;
}

// IntersectionObserver — not in iOS < 12.2 (used by framer-motion whileInView)
if (typeof IntersectionObserver === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("intersection-observer");
}

// AbortController — not in iOS < 12 (used by fetch/React Query)
if (typeof AbortController === "undefined") {
  (window as any).AbortController = class AbortController {
    signal = { aborted: false, addEventListener: () => {}, removeEventListener: () => {} };
    abort() { this.signal.aborted = true; }
  };
}

// URLSearchParams — not in iOS < 10.3
if (typeof URLSearchParams === "undefined") {
  (window as any).URLSearchParams = class URLSearchParams {
    private params: Record<string, string> = {};
    constructor(init?: string) {
      if (init) {
        init.replace(/^\?/, "").split("&").forEach((p) => {
          const [k, v] = p.split("=");
          if (k) this.params[decodeURIComponent(k)] = decodeURIComponent(v || "");
        });
      }
    }
    get(key: string) { return this.params[key] ?? null; }
    set(key: string, value: string) { this.params[key] = value; }
    has(key: string) { return key in this.params; }
    toString() {
      return Object.entries(this.params).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
    }
  };
}

