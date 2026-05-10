/* Polyfills for iOS 10-12, Samsung 2017, Chrome 70
   IMPORTANT: use only ES5-compatible syntax here, no classes, no arrow fat imports */

// ── Array ─────────────────────────────────────────────────────────────────
if (!Array.prototype.flat) {
  (Array.prototype as any).flat = function (depth: any) {
    depth = depth === undefined ? 1 : Math.floor(depth);
    return (function flat(arr: any[], d: number): any[] {
      return arr.reduce(function (acc: any[], val: any) {
        return acc.concat(Array.isArray(val) && d > 0 ? flat(val, d - 1) : val);
      }, []);
    })(this, depth);
  };
}

if (!Array.prototype.flatMap) {
  (Array.prototype as any).flatMap = function (fn: any, ctx?: any) {
    return Array.prototype.map.call(this, fn, ctx).reduce(function (a: any[], v: any) {
      return a.concat(v);
    }, []);
  };
}

// ── Object ────────────────────────────────────────────────────────────────
if (!Object.fromEntries) {
  (Object as any).fromEntries = function (entries: any) {
    return Array.from(entries as any[]).reduce(function (obj: any, pair: any) {
      obj[pair[0]] = pair[1];
      return obj;
    }, {});
  };
}

// ── String ────────────────────────────────────────────────────────────────
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (search: any, replace: any) {
    return this.split(search).join(replace);
  };
}

// ── Promise ───────────────────────────────────────────────────────────────
if (!Promise.allSettled) {
  (Promise as any).allSettled = function (promises: any[]) {
    return Promise.all(
      promises.map(function (p: any) {
        return Promise.resolve(p)
          .then(function (v: any) { return { status: "fulfilled", value: v }; })
          .catch(function (r: any) { return { status: "rejected", reason: r }; });
      })
    );
  };
}

// ── Globals ───────────────────────────────────────────────────────────────
if (typeof (window as any).queueMicrotask === "undefined") {
  (window as any).queueMicrotask = function (fn: () => void) {
    Promise.resolve().then(fn);
  };
}

if (typeof (window as any).globalThis === "undefined") {
  (window as any).globalThis = window;
}

// ── AbortController stub — iOS < 12 ──────────────────────────────────────
if (typeof (window as any).AbortController === "undefined") {
  (window as any).AbortController = function AbortControllerPolyfill() {
    this.signal = { aborted: false, addEventListener: function () {}, removeEventListener: function () {} };
  };
  (window as any).AbortController.prototype.abort = function () {
    this.signal.aborted = true;
  };
}

// ── ResizeObserver — iOS < 13.4 ──────────────────────────────────────────
// Loaded via static import below; applied conditionally at runtime
import { ResizeObserver as JuggleRO } from "@juggle/resize-observer";
if (typeof (window as any).ResizeObserver === "undefined") {
  (window as any).ResizeObserver = JuggleRO;
}

// ── IntersectionObserver — iOS < 12.2 ────────────────────────────────────
// Stub: framer-motion only needs it for whileInView; safe to no-op
if (typeof (window as any).IntersectionObserver === "undefined") {
  (window as any).IntersectionObserver = function IOPolyfill(cb: any) {
    this._cb = cb;
    this._els = [];
  };
  (window as any).IntersectionObserver.prototype.observe = function (el: any) {
    this._els.push(el);
    // immediately fire as "intersecting" so content shows
    try { this._cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this); } catch (_) {}
  };
  (window as any).IntersectionObserver.prototype.unobserve = function () {};
  (window as any).IntersectionObserver.prototype.disconnect = function () {};
}

// ── MediaQueryList.addEventListener — iOS < 14 ───────────────────────────
if (typeof window !== "undefined" && window.matchMedia) {
  try {
    const testMql = window.matchMedia("(min-width:0px)");
    if (testMql && typeof testMql.addEventListener !== "function") {
      const _orig = window.matchMedia.bind(window);
      (window as any).matchMedia = function (query: string) {
        const mql: any = _orig(query);
        if (mql && typeof mql.addEventListener !== "function") {
          mql.addEventListener = function (_t: string, listener: any) {
            return mql.addListener(typeof listener === "function" ? listener : listener.handleEvent.bind(listener));
          };
          mql.removeEventListener = function (_t: string, listener: any) {
            return mql.removeListener(typeof listener === "function" ? listener : listener.handleEvent.bind(listener));
          };
        }
        return mql;
      };
    }
  } catch (_) { /* ignore */ }
}
