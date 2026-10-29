import { EventEmitter } from "node:events";
const hrtime$1 = /* @__PURE__ */ Object.assign(function hrtime(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, { bigint: function bigint() {
  return BigInt(Date.now() * 1e6);
} });
class ReadStream {
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
}
class WriteStream {
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
}
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = () => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  };
  return Object.assign(fn, { __unenv__: true });
}
const NODE_VERSION = "22.14.0";
class Process extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw /* @__PURE__ */ createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ createNotImplementedError("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ createNotImplementedError("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ createNotImplementedError("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
}
const globalProcess = globalThis["process"];
const getBuiltinModule = globalProcess.getBuiltinModule;
const workerdProcess = getBuiltinModule("node:process");
const unenvProcess = new Process({
  env: globalProcess.env,
  hrtime: hrtime$1,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
const { exit, features, platform } = workerdProcess;
const {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime2,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
const _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime2,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
globalThis.process = _process;
const _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
const _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
const nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
class PerformanceEntry {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
}
const PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
class PerformanceMeasure extends PerformanceEntry {
  entryType = "measure";
}
class PerformanceResourceTiming extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
}
class PerformanceObserverEntryList {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
}
class Performance {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
}
class PerformanceObserver {
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
}
const performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
let lastCapturedError;
const TTL_MS = 5e3;
function record(error) {
  lastCapturedError = { error, at: Date.now() };
}
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record(event.error ?? event));
  globalThis.addEventListener(
    "unhandledrejection",
    (event) => record(event.reason)
  );
}
function consumeLastCapturedError() {
  if (!lastCapturedError) return void 0;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = void 0;
    return void 0;
  }
  const { error } = lastCapturedError;
  lastCapturedError = void 0;
  return error;
}
function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
const hostFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};
const normalizeDoApp = (app) => {
  const services = Array.isArray(app.spec?.services) ? app.spec.services : [];
  const svc = services[0] ?? {};
  const specDomains = Array.isArray(app.spec?.domains) ? app.spec.domains : [];
  const domains = specDomains.map((d) => {
    const type = String(d.type ?? "").toUpperCase();
    const isPrimary = Boolean(d.primary) || type === "PRIMARY";
    return {
      domain: String(d.domain ?? "").trim().toLowerCase(),
      type: isPrimary ? "PRIMARY" : type || "ALIAS",
      primary: isPrimary
    };
  }).filter((d) => d.domain);
  const defaultHost = hostFromUrl(String(app.default_ingress ?? ""));
  if (defaultHost && !domains.some((d) => d.domain === defaultHost.toLowerCase())) {
    domains.unshift({
      domain: defaultHost.toLowerCase(),
      type: "DEFAULT",
      primary: false
    });
  }
  const github = svc.github?.repo ? `${svc.github.repo}${svc.github.branch ? `/${svc.github.branch}` : ""}` : "";
  return {
    id: String(app.id ?? ""),
    name: String(app.spec?.name ?? ""),
    region: String(app.region?.slug ?? "").toUpperCase(),
    liveUrl: String(app.live_url ?? app.default_ingress ?? ""),
    defaultIngress: String(app.default_ingress ?? ""),
    phase: String(app.active_deployment?.phase ?? ""),
    webService: String(svc.name ?? ""),
    instanceSize: String(svc.instance_size_slug ?? ""),
    instanceCount: typeof svc.instance_count === "number" ? svc.instance_count : null,
    github,
    domains
  };
};
async function fetchDigitalOceanApps(token) {
  const collected = [];
  let page = 1;
  for (; ; ) {
    const res = await fetch(`https://api.digitalocean.com/v2/apps?per_page=100&page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`DigitalOcean API ${res.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
    }
    const json2 = await res.json();
    collected.push(...json2.apps ?? []);
    if (!json2.links?.pages?.next) break;
    page += 1;
    if (page > 20) break;
  }
  return collected.map(normalizeDoApp).sort((a, b) => a.name.localeCompare(b.name));
}
let cache$1 = null;
const CACHE_MS$1 = 6e4;
async function handleAppPlatformApi(request, env2) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const token = String(env2?.DIGITALOCEAN_TOKEN ?? "").trim();
  if (!token) {
    return Response.json(
      { error: "Missing DIGITALOCEAN_TOKEN. Set wrangler secret DIGITALOCEAN_TOKEN." },
      { status: 500 }
    );
  }
  try {
    const now = Date.now();
    if (cache$1 && now - cache$1.at < CACHE_MS$1) {
      return Response.json({ apps: cache$1.apps, cached: true });
    }
    const apps = await fetchDigitalOceanApps(token);
    cache$1 = { at: now, apps };
    return Response.json({ apps, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load App Platform";
    return Response.json({ error: message }, { status: 502 });
  }
}
async function handleWebShieldSetupApi(request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const domain2 = String(body.domain ?? "").trim().toLowerCase();
  if (!domain2.includes(".")) {
    return Response.json({ error: "Thiếu domain" }, { status: 400 });
  }
  return Response.json({
    ok: false,
    pending: true,
    domain: domain2,
    sheetId: String(body.sheetId ?? ""),
    message: "Đã nhận domain. Bước gắn lên App Platform sẽ làm tiếp."
  });
}
const parseNamecheapExpires = (expires) => {
  const parts = expires.trim().split(/[/\-.]/);
  if (parts.length !== 3) return null;
  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const year = Number(parts[2]);
  if (!month || !day || !year) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
};
const formatNamecheapExpires = (expires) => {
  const d = parseNamecheapExpires(expires);
  if (!d) return expires;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const namecheapDaysLeft = (expires) => {
  const target = parseNamecheapExpires(expires);
  if (!target) return null;
  target.setHours(0, 0, 0, 0);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
};
const NC_PROD = "https://api.namecheap.com/xml.response";
const NC_SANDBOX = "https://api.sandbox.namecheap.com/xml.response";
const attr = (chunk, key) => chunk.match(new RegExp(`${key}="([^"]*)"`))?.[1] ?? "";
const parseDomainTags = (xml) => {
  const out = [];
  const re = /<Domain\b([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const a = m[1];
    const name = attr(a, "Name").toLowerCase();
    if (!name) continue;
    out.push({
      name,
      expires: attr(a, "Expires"),
      isExpired: attr(a, "IsExpired").toLowerCase() === "true",
      autoRenew: attr(a, "AutoRenew").toLowerCase() === "true"
    });
  }
  return out;
};
const parseApiError = (xml) => {
  const ipDenied = xml.match(/Invalid request IP:\s*([0-9.]+)/i);
  if (ipDenied) return `Invalid request IP: ${ipDenied[1]}`;
  if (/Status="OK"/i.test(xml)) return null;
  if (!/Status="ERROR"/i.test(xml) && !/<Errors/i.test(xml)) return null;
  const err = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i)?.[1]?.trim();
  return err?.replace(/<[^>]+>/g, "").trim() || null;
};
const parseTotalItems = (xml) => {
  const n = xml.match(/<TotalItems>(\d+)<\/TotalItems>/i)?.[1];
  return n ? parseInt(n, 10) : 0;
};
const normalizeDomainKey = (raw) => raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
async function fetchNamecheapDomainList(cfg) {
  const base = cfg.sandbox ? NC_SANDBOX : NC_PROD;
  const collected = [];
  let page = 1;
  let total = 0;
  do {
    const qs = new URLSearchParams({
      ApiUser: cfg.apiUser,
      ApiKey: cfg.apiKey,
      UserName: cfg.userName,
      ClientIp: cfg.clientIp,
      Command: "namecheap.domains.getList",
      Page: String(page),
      PageSize: "100",
      SortBy: "EXPIREDATE"
    });
    const res = await fetch(`${base}?${qs.toString()}`, { headers: { Accept: "application/xml" } });
    const xml = await res.text();
    const apiErr = parseApiError(xml);
    if (apiErr) throw new Error(apiErr);
    if (!res.ok) {
      throw new Error(`Namecheap HTTP ${res.status}: ${xml.replace(/\s+/g, " ").slice(0, 240)}`);
    }
    collected.push(...parseDomainTags(xml));
    total = parseTotalItems(xml) || collected.length;
    page += 1;
  } while (collected.length < total && page <= 50);
  return collected;
}
const toDomainMap = (list) => {
  const map = {};
  for (const d of list) map[d.name] = d;
  return map;
};
const resolveNamecheapDomain = (domain2, map) => {
  const key = normalizeDomainKey(domain2);
  if (map[key]) return map[key];
  const parts = key.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (map[parent]) return map[parent];
  }
  return void 0;
};
const readNamecheapConfig = (env2) => {
  const e = env2;
  const apiUser = String(e.NAMECHEAP_API_USER ?? "").trim();
  const apiKey = String(e.NAMECHEAP_API_KEY ?? "").trim();
  const clientIp = String(e.NAMECHEAP_CLIENT_IP ?? "").trim();
  if (!apiUser || !apiKey || !clientIp) return null;
  return {
    apiUser,
    apiKey,
    userName: String(e.NAMECHEAP_USERNAME ?? apiUser).trim(),
    clientIp,
    sandbox: String(e.NAMECHEAP_SANDBOX ?? "").toLowerCase() === "true"
  };
};
let cache = null;
const CACHE_MS = 60 * 60 * 1e3;
const fetchViaProxy = async (env2) => {
  const base = String(env2.NAMECHEAP_PROXY_URL ?? "").replace(/\/$/, "");
  const token = String(env2.NAMECHEAP_PROXY_TOKEN ?? "").trim();
  if (!base || !token) return [];
  const res = await fetch(`${base}/domains`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const text = await res.text();
  let json2 = {};
  try {
    json2 = JSON.parse(text);
  } catch {
    throw new Error(`Proxy ${res.status}: ${text.slice(0, 180)}`);
  }
  if (!res.ok) throw new Error(json2.error || `Proxy HTTP ${res.status}`);
  return json2.domains ?? [];
};
async function handleNamecheapApi(request, env2) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const wenv = env2;
  const proxyUrl = String(wenv.NAMECHEAP_PROXY_URL ?? "").trim();
  const cfg = readNamecheapConfig(env2);
  if (!proxyUrl && !cfg) {
    return Response.json(
      {
        error: "Missing Namecheap config. Set NAMECHEAP_PROXY_URL or NAMECHEAP_API_USER / API_KEY / CLIENT_IP."
      },
      { status: 500 }
    );
  }
  try {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_MS) {
      return Response.json({ domains: cache.domains, map: toDomainMap(cache.domains), cached: true });
    }
    const domains = proxyUrl ? await fetchViaProxy(wenv) : await fetchNamecheapDomainList(cfg);
    cache = { at: now, domains };
    return Response.json({ domains, map: toDomainMap(domains), cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load Namecheap domains";
    return Response.json({ error: message }, { status: 502 });
  }
}
const KV_KEY = "marks";
const isMark = (v) => v === "listing" || v === "sold";
const readMarks$1 = async (kv) => {
  const raw = await kv.get(KV_KEY, "json");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (isMark(val)) out[normalizeDomainKey(key)] = val;
  }
  return out;
};
async function handleDomainSaleApi(request, env2) {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) {
    return Response.json({ error: "DOMAIN_SALE_MARKS KV is not bound." }, { status: 500 });
  }
  if (request.method === "GET") {
    return Response.json({ marks: await readMarks$1(kv) });
  }
  if (request.method !== "PUT") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const domain2 = normalizeDomainKey(String(body.domain ?? ""));
  if (!domain2) return Response.json({ error: "Missing domain" }, { status: 400 });
  const marks = await readMarks$1(kv);
  if (body.status == null || body.status === "") {
    delete marks[domain2];
  } else if (isMark(body.status)) {
    marks[domain2] = body.status;
  } else {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  await kv.put(KV_KEY, JSON.stringify(marks));
  return Response.json({ marks, domain: domain2, status: marks[domain2] ?? null });
}
const SESSION_COOKIE = "egead_session";
const LOCAL_ADMIN_USER = "admin";
const LOCAL_ADMIN_EMAIL = "admin@egead.local";
const LOCAL_ADMIN_PASS_SHA256 = "4c05d2ec76a943f30fc9f464a570d785e87cb3dba17207d6c978f57cfd1a3058";
const STATE_COOKIE = "egead_oauth_state";
const KV_ALLOW_KEY = "auth_allowed_emails";
const SESSION_DAYS = 14;
const json$1 = (data, status = 200, extra) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", ...extra }
});
const parseEmails = (raw) => String(raw ?? "").split(/[,;\n]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"));
const unique = (list) => Array.from(new Set(list));
const b64urlFromBytes = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const bytesFromB64url = (s) => {
  const pad = "=".repeat((4 - s.length % 4) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const utf8ToB64url = (s) => b64urlFromBytes(new TextEncoder().encode(s));
const b64urlToUtf8$1 = (s) => new TextDecoder().decode(bytesFromB64url(s));
const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
const hmacSign = async (secret, data) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlFromBytes(new Uint8Array(sig));
};
const getCookie = (request, name) => {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
};
const cookieAttrs = (request, maxAge) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
};
const authSecret = (env2) => String(env2.AUTH_SECRET || env2.GOOGLE_CLIENT_SECRET || "").trim();
const readKvEmails = async (env2) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return [];
  const raw = await kv.get(KV_ALLOW_KEY, "json");
  if (!Array.isArray(raw)) return [];
  return unique(raw.map((x) => String(x).trim().toLowerCase()).filter((s) => s.includes("@")));
};
const writeKvEmails = async (env2, emails) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) throw new Error("KV is not bound.");
  await kv.put(KV_ALLOW_KEY, JSON.stringify(unique(emails)));
};
const pinnedEmails = (env2) => unique(parseEmails(env2.GOOGLE_ALLOWED_EMAILS));
const allowedEmails = async (env2) => unique([...pinnedEmails(env2), ...await readKvEmails(env2)]);
const adminEmails = (env2) => {
  const admins = parseEmails(env2.GOOGLE_ADMIN_EMAILS);
  if (admins.length) return unique(admins);
  const pinned = pinnedEmails(env2);
  return pinned.slice(0, 1);
};
const isAllowed = async (env2, email) => (await allowedEmails(env2)).includes(email.toLowerCase());
const isLocalAdmin = (email) => email.toLowerCase() === LOCAL_ADMIN_EMAIL;
const isAdmin = (env2, email) => isLocalAdmin(email) || adminEmails(env2).includes(email.toLowerCase());
const signSession = async (env2, user) => {
  const secret = authSecret(env2);
  if (!secret) throw new Error("Missing AUTH_SECRET");
  const payload = {
    ...user,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1e3
  };
  const body = utf8ToB64url(JSON.stringify(payload));
  const sig = await hmacSign(secret, body);
  return `${body}.${sig}`;
};
const readSession = async (env2, request) => {
  const secret = authSecret(env2);
  const token = getCookie(request, SESSION_COOKIE);
  if (!secret || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmacSign(secret, body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(b64urlToUtf8$1(body));
    if (!payload?.email || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!await isAllowed(env2, payload.email) && !isLocalAdmin(payload.email)) return null;
    return {
      email: String(payload.email).toLowerCase(),
      name: String(payload.name ?? payload.email),
      picture: String(payload.picture ?? "")
    };
  } catch {
    return null;
  }
};
const redirectUri = (request) => `${new URL(request.url).origin}/api/auth/google/callback`;
const loginRedirect = (request, params) => {
  const url = new URL("/login", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url.toString(), 302);
};
const LOGIN_SCOPES = "openid email profile";
const GMAIL_SCOPES = "openid email profile https://www.googleapis.com/auth/gmail.readonly";
const KV_GMAIL_TOKENS = "gmail_oauth_tokens";
const readGmailTokens = async (env2) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return {};
  const raw = await kv.get(KV_GMAIL_TOKENS, "json");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw;
};
const isGmailToken = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rec = value;
  return typeof rec.mailbox === "string" && Boolean(rec.refreshToken || rec.accessToken);
};
const mailboxesFromSlot = (slot) => {
  if (!slot || typeof slot !== "object" || Array.isArray(slot)) return [];
  const wrapped = slot;
  if (wrapped.mailboxes && typeof wrapped.mailboxes === "object" && !Array.isArray(wrapped.mailboxes)) {
    return Object.values(wrapped.mailboxes).filter(isGmailToken).sort((a, b) => a.mailbox.localeCompare(b.mailbox));
  }
  return isGmailToken(slot) ? [slot] : [];
};
const preferGmailToken = (prev, next) => {
  const prevRefresh = Boolean(prev.refreshToken);
  const nextRefresh = Boolean(next.refreshToken);
  const newer = (next.updatedAt || 0) >= (prev.updatedAt || 0);
  const winner = nextRefresh && !prevRefresh ? next : !nextRefresh && prevRefresh ? prev : newer ? next : prev;
  const other = winner === next ? prev : next;
  return {
    ...winner,
    refreshToken: winner.refreshToken || other.refreshToken,
    accessToken: winner.accessToken || other.accessToken,
    accessExp: winner.accessExp ?? other.accessExp
  };
};
const collectGmailMailboxes = (all) => {
  const byMailbox = /* @__PURE__ */ new Map();
  for (const slot of Object.values(all)) {
    for (const rec of mailboxesFromSlot(slot)) {
      const key = rec.mailbox.toLowerCase();
      const next = { ...rec, mailbox: key };
      const prev = byMailbox.get(key);
      byMailbox.set(key, prev ? preferGmailToken(prev, next) : next);
    }
  }
  return [...byMailbox.values()].sort((a, b) => a.mailbox.localeCompare(b.mailbox));
};
const ownersFromTokens = (all) => {
  const keys = Object.keys(all).map((key) => key.toLowerCase()).filter((key) => key.includes("@"));
  const shared = all.__shared__;
  const remembered = shared && typeof shared === "object" && !Array.isArray(shared) ? shared.owners : [];
  const extra = Array.isArray(remembered) ? remembered.filter((value) => typeof value === "string").map((value) => value.toLowerCase()).filter((value) => value.includes("@")) : [];
  return [.../* @__PURE__ */ new Set([...keys, ...extra])];
};
const listGmailTokenOwners = async (env2) => ownersFromTokens(await readGmailTokens(env2));
const listGmailMailboxes = async (env2, _ownerEmail) => {
  const all = await readGmailTokens(env2);
  return collectGmailMailboxes(all);
};
const getGmailToken = async (env2, ownerEmail, mailbox) => {
  const list = await listGmailMailboxes(env2);
  if (!mailbox) return list[0] ?? null;
  const key = mailbox.toLowerCase();
  return list.find((rec) => rec.mailbox.toLowerCase() === key) ?? null;
};
const writeGmailMailboxes = async (env2, list) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) throw new Error("KV is not bound.");
  if (!list.length) {
    await kv.put(KV_GMAIL_TOKENS, JSON.stringify({}));
    return;
  }
  const mailboxes = {};
  for (const rec of list) mailboxes[rec.mailbox.toLowerCase()] = { ...rec, mailbox: rec.mailbox.toLowerCase() };
  const owners = ownersFromTokens(await readGmailTokens(env2));
  await kv.put(KV_GMAIL_TOKENS, JSON.stringify({ __shared__: { mailboxes, owners } }));
};
const saveGmailToken = async (env2, ownerEmail, rec, mailbox) => {
  const list = await listGmailMailboxes(env2);
  if (!rec) {
    const drop = (mailbox || "").trim().toLowerCase();
    await writeGmailMailboxes(env2, drop ? list.filter((item) => item.mailbox.toLowerCase() !== drop) : []);
    return;
  }
  const key = rec.mailbox.toLowerCase();
  const prev = list.find((item) => item.mailbox.toLowerCase() === key);
  const next = list.filter((item) => item.mailbox.toLowerCase() !== key);
  next.push({ ...rec, mailbox: key, refreshToken: rec.refreshToken || prev?.refreshToken });
  await writeGmailMailboxes(env2, next);
};
const startOAuth = async (request, env2, intent) => {
  const clientId = String(env2.GOOGLE_CLIENT_ID ?? "").trim();
  const secret = authSecret(env2);
  if (!clientId || !String(env2.GOOGLE_CLIENT_SECRET ?? "").trim() || !secret) {
    return loginRedirect(request, { error: "not_configured" });
  }
  if (intent === "gmail") {
    const user = await readSession(env2, request);
    if (!user) return Response.redirect(new URL("/login", request.url).toString(), 302);
  }
  const nonce = b64urlFromBytes(crypto.getRandomValues(new Uint8Array(24)));
  const gmailNext = new URL(request.url).searchParams.get("next") === "/shopify-orders" ? "orders" : "bills";
  const state = intent === "gmail" ? `gmail.${nonce}.${gmailNext}` : `${intent}.${nonce}`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", intent === "gmail" ? GMAIL_SCOPES : LOGIN_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("include_granted_scopes", "true");
  if (intent === "gmail") {
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "select_account consent");
  } else {
    authUrl.searchParams.set("prompt", "select_account");
  }
  const res = new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
  res.headers.append("Set-Cookie", `${STATE_COOKIE}=${state}; ${cookieAttrs(request, 600)}`);
  return res;
};
const startGoogle = (request, env2) => startOAuth(request, env2, "login");
const startGmail = (request, env2) => startOAuth(request, env2, "gmail");
const googleCallback = async (request, env2) => {
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) return loginRedirect(request, { error: "denied" });
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const saved = getCookie(request, STATE_COOKIE);
  if (!code || !state || !saved || !timingSafeEqual(state, saved)) {
    return loginRedirect(request, { error: "oauth_failed" });
  }
  const clientId = String(env2.GOOGLE_CLIENT_ID ?? "").trim();
  const clientSecret = String(env2.GOOGLE_CLIENT_SECRET ?? "").trim();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(request),
      grant_type: "authorization_code"
    })
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return loginRedirect(request, { error: "oauth_failed" });
  }
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` }
  });
  const profile = await userRes.json();
  const email = String(profile.email ?? "").trim().toLowerCase();
  const verified = profile.email_verified === true || profile.email_verified === "true";
  if (!email || !verified) return loginRedirect(request, { error: "oauth_failed" });
  const intent = state.split(".")[0] || "login";
  if (intent !== "gmail" && !await isAllowed(env2, email)) {
    return loginRedirect(request, { error: "not_allowed", email });
  }
  const user = {
    email,
    name: String(profile.name ?? email),
    picture: String(profile.picture ?? "")
  };
  if (intent === "gmail") {
    const sessionUser = await readSession(env2, request);
    if (!sessionUser) return loginRedirect(request, { error: "oauth_failed" });
    const existing = await getGmailToken(env2, sessionUser.email, email);
    await saveGmailToken(env2, sessionUser.email, {
      refreshToken: tokenJson.refresh_token || existing?.refreshToken,
      accessToken: tokenJson.access_token,
      accessExp: Date.now() + Math.max(60, Number(tokenJson.expires_in || 3600) - 60) * 1e3,
      mailbox: email,
      updatedAt: Date.now()
    });
    const nextPath = state.split(".")[2] === "orders" ? "/shopify-orders" : "/shopify-bills";
    const res2 = new Response(null, {
      status: 302,
      headers: { Location: new URL(`${nextPath}?gmail=1`, request.url).toString() }
    });
    res2.headers.append("Set-Cookie", `${STATE_COOKIE}=; ${cookieAttrs(request, 0)}`);
    return res2;
  }
  const session = await signSession(env2, user);
  const res = new Response(null, {
    status: 302,
    headers: { Location: new URL("/login?ok=1", request.url).toString() }
  });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session}; ${cookieAttrs(request, SESSION_DAYS * 86400)}`);
  res.headers.append("Set-Cookie", `${STATE_COOKIE}=; ${cookieAttrs(request, 0)}`);
  return res;
};
const sha256Hex = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const handlePasswordLogin = async (request, env2) => {
  if (request.method !== "POST") return json$1({ error: "Method not allowed" }, 405);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json$1({ error: "Invalid JSON" }, 400);
  }
  const userName = String(body.user ?? "").trim().toLowerCase();
  const passHash = await sha256Hex(String(body.password ?? ""));
  const userOk = timingSafeEqual(userName, LOCAL_ADMIN_USER);
  const passOk = timingSafeEqual(passHash, LOCAL_ADMIN_PASS_SHA256);
  if (!userOk || !passOk) return json$1({ error: "Sai tài khoản hoặc mật khẩu." }, 401);
  const user = { email: LOCAL_ADMIN_EMAIL, name: "Admin", picture: "" };
  const session = await signSession(env2, user);
  const res = json$1({ ok: true, user });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session}; ${cookieAttrs(request, SESSION_DAYS * 86400)}`);
  return res;
};
const handleMe = async (request, env2) => {
  const user = await readSession(env2, request);
  if (!user) return json$1({ user: null }, 401);
  return json$1({
    user,
    admin: isAdmin(env2, user.email)
  });
};
const handleLogout = (request) => {
  const res = json$1({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; ${cookieAttrs(request, 0)}`);
  return res;
};
const handleUsers = async (request, env2) => {
  const user = await readSession(env2, request);
  if (!user) return json$1({ error: "Unauthorized" }, 401);
  const pinned = pinnedEmails(env2);
  const extra = await readKvEmails(env2);
  const emails = unique([...pinned, ...extra]);
  if (request.method === "GET") {
    return json$1({ emails, pinned, admin: isAdmin(env2, user.email) });
  }
  if (request.method !== "PUT") return json$1({ error: "Method not allowed" }, 405);
  if (!isAdmin(env2, user.email)) return json$1({ error: "Forbidden" }, 403);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json$1({ error: "Invalid JSON" }, 400);
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return json$1({ error: "Invalid email" }, 400);
  if (body.action === "add") {
    await writeKvEmails(env2, [...extra, email]);
  } else if (body.action === "remove") {
    if (pinned.includes(email)) {
      return json$1({ error: "Cannot remove a pinned admin email." }, 400);
    }
    await writeKvEmails(env2, extra.filter((e) => e !== email));
  } else {
    return json$1({ error: "Invalid action" }, 400);
  }
  const nextExtra = await readKvEmails(env2);
  return json$1({ emails: unique([...pinned, ...nextExtra]), pinned, admin: true });
};
async function refreshGmailAccess(env2, ownerEmail, mailbox) {
  const rec = await getGmailToken(env2, ownerEmail, mailbox);
  if (!rec) return { error: "Chưa kết nối Gmail.", code: "not_connected" };
  if (rec.accessToken && rec.accessExp && rec.accessExp > Date.now() + 15e3) {
    return { token: rec.accessToken, mailbox: rec.mailbox };
  }
  if (!rec.refreshToken) return { error: "Gmail hết hạn. Kết nối lại.", code: "expired" };
  const clientId = String(env2.GOOGLE_CLIENT_ID ?? "").trim();
  const clientSecret = String(env2.GOOGLE_CLIENT_SECRET ?? "").trim();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: rec.refreshToken,
      grant_type: "refresh_token"
    })
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return { error: "Không làm mới được Gmail. Kết nối lại.", code: "refresh_failed" };
  }
  const next = {
    ...rec,
    accessToken: tokenJson.access_token,
    accessExp: Date.now() + Math.max(60, Number(tokenJson.expires_in || 3600) - 60) * 1e3,
    updatedAt: Date.now()
  };
  await saveGmailToken(env2, ownerEmail, next);
  return { token: next.accessToken, mailbox: next.mailbox };
}
async function handleGoogleAuthApi(request, env2) {
  const wenv = env2;
  const path = new URL(request.url).pathname;
  if (path === "/api/auth/password") return handlePasswordLogin(request, wenv);
  if (path === "/api/auth/google") return startGoogle(request, wenv);
  if (path === "/api/auth/gmail") return startGmail(request, wenv);
  if (path === "/api/auth/google/callback") return googleCallback(request, wenv);
  if (path === "/api/auth/me") return handleMe(request, wenv);
  if (path === "/api/auth/logout") return handleLogout(request);
  if (path === "/api/auth/users") return handleUsers(request, wenv);
  if (path === "/api/auth/status") {
    return json$1({
      google: Boolean(String(wenv.GOOGLE_CLIENT_ID ?? "").trim() && String(wenv.GOOGLE_CLIENT_SECRET ?? "").trim())
    });
  }
  return json$1({ error: "Not found" }, 404);
}
const KV_MARKS = "shopify_email_bill_marks";
const GMAIL_Q = 'from:billing@shopify.com (subject:"bill for" OR subject:"Your bill was credited")';
const isCreditSubject = (subject) => /your bill was credited/i.test(subject);
const planShopFromSubject = (subject) => {
  if (isCreditSubject(subject)) return "";
  const m = subject.match(/\bbill for\s+(.+?)\s*$/i);
  return m?.[1]?.trim() || "";
};
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});
const headerOf = (headers, name) => {
  const n = name.toLowerCase();
  return String(headers?.find((h) => String(h.name || "").toLowerCase() === n)?.value ?? "").trim();
};
const b64urlToUtf8 = (raw) => {
  const pad = "=".repeat((4 - raw.length % 4) % 4);
  const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
};
const collectText = (part, out) => {
  if (!part) return;
  const mime = String(part.mimeType || "").toLowerCase();
  if (part.body?.data && (mime.startsWith("text/plain") || mime.startsWith("text/html") || mime === "")) {
    let text = b64urlToUtf8(part.body.data);
    if (mime.includes("html")) {
      text = text.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#36;/g, "$");
    }
    out.push(text);
  }
  for (const child of part.parts || []) collectText(child, out);
};
const parseAmount = (text) => {
  const labeled = text.match(
    /(?:total|amount|charged|invoice total|payment of|you've been charged|grand total)\s*:?\s*(?:usd|us\$)?\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i
  );
  const plain = text.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/);
  const usd = text.match(/(?:usd|us\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i);
  const raw = labeled?.[1] || usd?.[1] || plain?.[1];
  if (!raw) return null;
  const amount = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency: "USD" };
};
const hostLabel = (host) => host.toLowerCase().replace(/^www\./, "").split(".")[0] || "";
const titleCase = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const domainFromSupportTo = (toHeader) => {
  const emails = [...String(toHeader).matchAll(/([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi)];
  for (const m of emails) {
    const local = m[1].toLowerCase();
    if (local === "support" || local === "contact") return m[2].toLowerCase();
  }
  return "";
};
const parsePlanRefund = (credit, fallback) => {
  const amt = fallback || 0;
  if (credit) return { planAmount: 0, refundAmount: amt };
  return { planAmount: amt, refundAmount: 0 };
};
const ymFromMs = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const isoFromMs = (ms) => new Date(ms).toISOString();
const readMarks = async (env2) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return {};
  const raw = await kv.get(KV_MARKS, "json");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [id, val] of Object.entries(raw)) {
    if (val === "noted" || val === "ignored") out[id] = val;
  }
  return out;
};
const writeMarks = async (env2, marks) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) throw new Error("KV is not bound.");
  await kv.put(KV_MARKS, JSON.stringify(marks));
};
const gmailGet = async (token, path) => {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
};
const mapMessage = (msg, mailbox, marks) => {
  const id = String(msg.id || "");
  if (!id) return null;
  const headers = msg.payload?.headers;
  const subject = headerOf(headers, "Subject") || "(no subject)";
  const credit = isCreditSubject(subject);
  const planShop = planShopFromSubject(subject);
  if (!credit && !planShop) return null;
  const from = headerOf(headers, "From");
  const to = headerOf(headers, "To") || headerOf(headers, "Delivered-To") || headerOf(headers, "X-Original-To");
  const ms = Number(msg.internalDate || 0) || Date.now();
  const texts = [];
  collectText(msg.payload, texts);
  const body = texts.join("\n");
  const parsed = parseAmount(`${subject}
${msg.snippet || ""}
${body}`);
  const money = parsePlanRefund(credit, parsed?.amount ?? null);
  let shop = planShop;
  let domain2 = "";
  if (credit) {
    domain2 = domainFromSupportTo(to);
    shop = titleCase(hostLabel(domain2)) || "—";
  }
  return {
    id,
    threadId: String(msg.threadId || id),
    date: isoFromMs(ms),
    month: ymFromMs(ms),
    from,
    to,
    mailbox,
    subject,
    snippet: String(msg.snippet || "").replace(/\s+/g, " ").trim(),
    shop,
    domain: domain2,
    amount: parsed?.amount ?? null,
    planAmount: money.planAmount,
    refundAmount: money.refundAmount,
    currency: parsed?.currency || "USD",
    kind: credit ? "credit" : "invoice",
    mark: marks[id] ?? null,
    gmailUrl: gmailLink(mailbox, String(msg.threadId || id))
  };
};
const requireUser = async (request, env2) => {
  const user = await readSession(env2, request);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return user;
};
const gmailLink = (mailbox, threadId) => `https://mail.google.com/mail/?authuser=${encodeURIComponent(mailbox)}#all/${threadId}`;
const cacheKeyOf = (owner, mailbox, year, days) => `gmail_shopify_bills:${owner.toLowerCase()}:${mailbox.toLowerCase()}:${year || `d${days}`}`;
const legacyBillsKey = (owner, year, days) => `gmail_shopify_bills:${owner.toLowerCase()}:${year || `d${days}`}`;
const orderCacheKeyOf = (owner, mailbox, year) => `gmail_shopify_orders:${owner.toLowerCase()}:${mailbox.toLowerCase()}:${year || "all"}`;
const legacyOrdersKey = (owner, year) => `gmail_shopify_orders:${owner.toLowerCase()}:${year || "all"}`;
const ORDER_GMAIL_Q = 'subject:"Order #" subject:"placed by"';
const parseOrderSubject = (subject) => {
  const clean = subject.replace(/\s+/g, " ").trim();
  const m = clean.match(/\[([^\]]+)\]\s*Order\s+(#?[A-Za-z0-9_-]+)\s+placed by\s+(.+)$/i);
  if (!m) return null;
  const rawNo = m[2].trim();
  const customer = m[3].replace(/\s*(?:->|–|—)\s*.+$/, "").trim();
  if (!customer) return null;
  return {
    shop: m[1].trim(),
    orderNo: rawNo.startsWith("#") ? rawNo : `#${rawNo}`,
    customer
  };
};
const parseOrderTotal = (text) => {
  const labeled = text.match(
    /(?:grand\s+)?total(?:\s+price)?\s*:?\s*(?:usd|us\$)?\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i
  );
  if (!labeled?.[1] || /subtotal/i.test(labeled[0])) {
    const all = [...text.matchAll(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/g)];
    const last = all[all.length - 1]?.[1];
    const n2 = last ? Number(last.replace(/,/g, "")) : 0;
    return Number.isFinite(n2) && n2 > 0 ? n2 : null;
  }
  const n = Number(labeled[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const readBillsCache = async (env2, key) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return null;
  const raw = await kv.get(key, "json");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw;
  if (!Array.isArray(rec.bills) || !rec.fetchedAt) return null;
  return rec;
};
const writeBillsCache = async (env2, key, rec) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return;
  await kv.put(key, JSON.stringify(rec));
};
const readScopedCache = async (env2, key, legacyKey, mailbox) => {
  const hit = await readBillsCache(env2, key);
  if (hit) return hit;
  const legacy = await readBillsCache(env2, legacyKey);
  if (!legacy) return null;
  const box = String(legacy.mailbox || "").toLowerCase();
  if (!box || box !== mailbox.toLowerCase()) return null;
  const migrated = { ...legacy, mailbox: mailbox.toLowerCase() };
  await writeBillsCache(env2, key, migrated);
  return migrated;
};
const readSharedMailboxCache = async (env2, userEmail, mailbox, ownKey, ownLegacyKey, keyForOwner, legacyForOwner) => {
  const own = await readScopedCache(env2, ownKey, ownLegacyKey, mailbox);
  if (own) return own;
  const owners = await listGmailTokenOwners(env2);
  for (const owner of owners) {
    if (owner === userEmail.toLowerCase()) continue;
    const hit = await readScopedCache(env2, keyForOwner(owner), legacyForOwner(owner), mailbox);
    if (!hit) continue;
    const copied = { ...hit, mailbox: mailbox.toLowerCase() };
    await writeBillsCache(env2, ownKey, copied);
    return copied;
  }
  return null;
};
const deleteBillsCache = async (env2, owner, mailbox) => {
  const kv = env2.DOMAIN_SALE_MARKS;
  if (!kv) return;
  const boxes = mailbox ? [mailbox.toLowerCase()] : (await listGmailMailboxes(env2)).map((rec) => rec.mailbox.toLowerCase());
  const owners = [.../* @__PURE__ */ new Set([owner.toLowerCase(), ...await listGmailTokenOwners(env2)])];
  for (const who of owners) {
    for (const box of boxes) {
      await kv.put(cacheKeyOf(who, box, 2026, 400), JSON.stringify(null));
      await kv.put(orderCacheKeyOf(who, box, 2026), JSON.stringify(null));
    }
  }
  const legacyBills = await readBillsCache(env2, legacyBillsKey(owner, 2026, 400));
  if (!mailbox || !legacyBills?.mailbox || legacyBills.mailbox.toLowerCase() === mailbox.toLowerCase()) {
    await kv.put(legacyBillsKey(owner, 2026, 400), JSON.stringify(null));
  }
  const legacyOrders = await readBillsCache(env2, legacyOrdersKey(owner, 2026));
  if (!mailbox || !legacyOrders?.mailbox || legacyOrders.mailbox.toLowerCase() === mailbox.toLowerCase()) {
    await kv.put(legacyOrdersKey(owner, 2026), JSON.stringify(null));
  }
};
const applyMarks = (bills, marks) => bills.map((b) => ({ ...b, mark: marks[b.id] ?? null }));
const gmailErrorText = (data) => {
  const err = String(data?.error?.message || "Gmail API lỗi");
  return /has not been used|disabled|access not configured/i.test(err) ? "Bật Gmail API trong Google Cloud Console cho OAuth client này." : err;
};
const withGmailLink = (row) => ({
  ...row,
  gmailUrl: row.mailbox ? gmailLink(row.mailbox, row.threadId || row.id) : row.gmailUrl
});
const pickMailboxes = async (env2, owner, raw) => {
  const all = await listGmailMailboxes(env2);
  const want = raw.trim().toLowerCase();
  const selected = !want || want === "all" ? all : all.filter((rec) => rec.mailbox.toLowerCase() === want);
  return { all, selected, filter: !want || want === "all" ? "all" : want };
};
const listMessageIds = async (token, q, maxResults) => {
  const ids = [];
  let pageToken = "";
  while (ids.length < maxResults) {
    const pageSize = Math.min(100, maxResults - ids.length);
    const path = `messages?q=${encodeURIComponent(q)}&maxResults=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const listed = await gmailGet(token, path);
    if (!listed.ok) return { ids, error: gmailErrorText(listed.data) };
    const batch = (listed.data.messages || []).map((m) => m.id).filter(Boolean);
    ids.push(...batch);
    pageToken = String(listed.data.nextPageToken || "");
    if (!pageToken || batch.length === 0) break;
  }
  return { ids, error: "" };
};
const billsPayload = (bills, extra) => {
  const totalUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? 0 : b.amount || 0), 0);
  const failedUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? b.amount || 0 : 0), 0);
  const notedUsd = bills.reduce((s, b) => s + (b.mark === "noted" ? b.amount || 0 : 0), 0);
  const planUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? 0 : b.planAmount || 0), 0);
  const refundUsd = bills.reduce((s, b) => s + (b.refundAmount || 0), 0);
  return json({
    connected: true,
    mailbox: extra.mailbox,
    mailboxes: extra.mailboxes,
    warnings: extra.warnings,
    query: extra.query,
    days: extra.days,
    year: extra.year,
    fetchedAt: extra.fetchedAt,
    cached: extra.cached,
    bills,
    totals: {
      count: bills.length,
      totalUsd,
      planUsd,
      refundUsd,
      failedUsd,
      notedUsd,
      openUsd: bills.reduce((s, b) => s + (!b.mark && b.kind !== "failed" ? b.amount || 0 : 0), 0)
    }
  });
};
const listBills = async (request, env2, user) => {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") || 0);
  const days = Math.min(400, Math.max(30, Number(url.searchParams.get("days") || (year ? 400 : 180))));
  const refresh = url.searchParams.get("refresh") === "1";
  const maxResults = Math.min(250, Math.max(10, Number(url.searchParams.get("limit") || (year ? 200 : 60))));
  const q = year ? `${GMAIL_Q} after:${year}/01/01 before:${year + 1}/01/01` : `${GMAIL_Q} newer_than:${days}d`;
  const { all, selected, filter } = await pickMailboxes(env2, user.email, url.searchParams.get("mailbox") || "all");
  if (!all.length) return json({ error: "Chưa kết nối Gmail.", code: "not_connected", connected: false }, 409);
  if (!selected.length) return json({ error: "Không thấy hộp thư này.", code: "unknown_mailbox", connected: true, mailboxes: all.map((r) => r.mailbox) }, 404);
  const marks = await readMarks(env2);
  const parts = await Promise.all(selected.map(async (box) => {
    const cacheKey = cacheKeyOf(user.email, box.mailbox, year, days);
    if (!refresh) {
      const cached = await readSharedMailboxCache(
        env2,
        user.email,
        box.mailbox,
        cacheKey,
        legacyBillsKey(user.email, year, days),
        (owner) => cacheKeyOf(owner, box.mailbox, year, days),
        (owner) => legacyBillsKey(owner, year, days)
      );
      if (cached) {
        return {
          bills: applyMarks(cached.bills, marks).map(withGmailLink),
          fetchedAt: cached.fetchedAt,
          cached: true,
          error: ""
        };
      }
    }
    const access = await refreshGmailAccess(env2, user.email, box.mailbox);
    if ("error" in access) return { bills: [], fetchedAt: 0, cached: false, error: access.error };
    const listed = await listMessageIds(access.token, q, maxResults);
    if (listed.error) return { bills: [], fetchedAt: 0, cached: false, error: listed.error };
    const bills2 = [];
    for (let i = 0; i < listed.ids.length; i += 8) {
      const chunk = listed.ids.slice(i, i + 8);
      const rows = await Promise.all(chunk.map(async (id) => {
        const got = await gmailGet(access.token, `messages/${id}?format=full`);
        if (!got.ok) return null;
        return mapMessage(got.data, access.mailbox, marks);
      }));
      for (const row of rows) if (row) bills2.push(row);
    }
    const fetchedAt = Date.now();
    await writeBillsCache(env2, cacheKey, {
      fetchedAt,
      mailbox: access.mailbox,
      query: q,
      days,
      year: year || null,
      bills: bills2
    });
    return { bills: bills2, fetchedAt, cached: false, error: "" };
  }));
  const warnings = parts.flatMap((part, i) => part.error ? [{ mailbox: selected[i].mailbox, error: part.error }] : []);
  const failed = parts.every((part) => part.error);
  if (failed) {
    return json({ error: warnings[0]?.error || "Gmail API lỗi", code: "gmail_api", connected: true, mailboxes: all.map((r) => r.mailbox), warnings }, 502);
  }
  const bills = parts.flatMap((part) => part.bills).sort((a, b) => b.date.localeCompare(a.date));
  const stamps = parts.map((part) => part.fetchedAt).filter((n) => n > 0);
  return billsPayload(bills, {
    mailbox: filter,
    mailboxes: all.map((r) => r.mailbox),
    warnings,
    query: q,
    days,
    year: year || null,
    fetchedAt: stamps.length ? Math.min(...stamps) : Date.now(),
    cached: parts.every((part) => part.cached || part.error)
  });
};
const updateMark = async (request, env2) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const id = String(body.id || "").trim();
  if (!id) return json({ error: "Missing id" }, 400);
  const marks = await readMarks(env2);
  if (body.status === "noted" || body.status === "ignored") marks[id] = body.status;
  else delete marks[id];
  await writeMarks(env2, marks);
  return json({ id, status: marks[id] ?? null });
};
const mapOrder = (msg, mailbox) => {
  const id = String(msg.id || "");
  if (!id) return null;
  const subject = headerOf(msg.payload?.headers, "Subject") || "";
  const parsed = parseOrderSubject(subject);
  if (!parsed) return null;
  const ms = Number(msg.internalDate || 0) || Date.now();
  const snippet = String(msg.snippet || "").replace(/\s+/g, " ").trim();
  return {
    id,
    threadId: String(msg.threadId || id),
    date: isoFromMs(ms),
    month: ymFromMs(ms),
    from: headerOf(msg.payload?.headers, "From"),
    mailbox,
    subject,
    snippet,
    shop: parsed.shop,
    orderNo: parsed.orderNo,
    customer: parsed.customer,
    amount: parseOrderTotal(`${subject}
${snippet}`),
    gmailUrl: gmailLink(mailbox, String(msg.threadId || id))
  };
};
const ordersOfCache = (cached) => {
  const extra = cached;
  return extra.orders || cached.bills;
};
const listOrders = async (request, env2, user) => {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") || 2026);
  const refresh = url.searchParams.get("refresh") === "1";
  const maxResults = Math.min(300, Math.max(10, Number(url.searchParams.get("limit") || 250)));
  const q = `${ORDER_GMAIL_Q} after:${year}/01/01 before:${year + 1}/01/01`;
  const { all, selected, filter } = await pickMailboxes(env2, user.email, url.searchParams.get("mailbox") || "all");
  if (!all.length) return json({ error: "Chưa kết nối Gmail.", code: "not_connected", connected: false }, 409);
  if (!selected.length) return json({ error: "Không thấy hộp thư này.", code: "unknown_mailbox", connected: true, mailboxes: all.map((r) => r.mailbox) }, 404);
  const parts = await Promise.all(selected.map(async (box) => {
    const cacheKey = orderCacheKeyOf(user.email, box.mailbox, year);
    if (!refresh) {
      const cached = await readSharedMailboxCache(
        env2,
        user.email,
        box.mailbox,
        cacheKey,
        legacyOrdersKey(user.email, year),
        (owner) => orderCacheKeyOf(owner, box.mailbox, year),
        (owner) => legacyOrdersKey(owner, year)
      );
      if (cached && Array.isArray(ordersOfCache(cached))) {
        return {
          orders: ordersOfCache(cached).map(withGmailLink),
          fetchedAt: cached.fetchedAt,
          cached: true,
          error: ""
        };
      }
    }
    const access = await refreshGmailAccess(env2, user.email, box.mailbox);
    if ("error" in access) return { orders: [], fetchedAt: 0, cached: false, error: access.error };
    const listed = await listMessageIds(access.token, q, maxResults);
    if (listed.error) return { orders: [], fetchedAt: 0, cached: false, error: listed.error };
    const orders2 = [];
    for (let i = 0; i < listed.ids.length; i += 12) {
      const chunk = listed.ids.slice(i, i + 12);
      const rows = await Promise.all(chunk.map(async (id) => {
        const got = await gmailGet(access.token, `messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`);
        if (!got.ok) return null;
        return mapOrder(got.data, access.mailbox);
      }));
      for (const row of rows) if (row) orders2.push(row);
    }
    const fetchedAt = Date.now();
    await writeBillsCache(env2, cacheKey, {
      fetchedAt,
      mailbox: access.mailbox,
      query: q,
      days: 0,
      year,
      bills: orders2,
      orders: orders2
    });
    return { orders: orders2, fetchedAt, cached: false, error: "" };
  }));
  const warnings = parts.flatMap((part, i) => part.error ? [{ mailbox: selected[i].mailbox, error: part.error }] : []);
  if (parts.every((part) => part.error)) {
    return json({ error: warnings[0]?.error || "Gmail API lỗi", code: "gmail_api", connected: true, mailboxes: all.map((r) => r.mailbox), warnings }, 502);
  }
  const orders = parts.flatMap((part) => part.orders).sort((a, b) => b.date.localeCompare(a.date));
  const stamps = parts.map((part) => part.fetchedAt).filter((n) => n > 0);
  return json({
    connected: true,
    mailbox: filter,
    mailboxes: all.map((r) => r.mailbox),
    warnings,
    query: q,
    year,
    fetchedAt: stamps.length ? Math.min(...stamps) : Date.now(),
    cached: parts.every((part) => part.cached || part.error),
    orders,
    totals: {
      count: orders.length,
      totalUsd: orders.reduce((s, o) => s + (o.amount || 0), 0)
    }
  });
};
async function handleGmailShopifyApi(request, env2) {
  const wenv = env2;
  const path = new URL(request.url).pathname;
  const user = await requireUser(request, wenv);
  if (user instanceof Response) return user;
  if (path === "/api/gmail/status") {
    const boxes = await listGmailMailboxes(wenv, user.email);
    return json({
      connected: boxes.some((rec) => rec.refreshToken || rec.accessToken),
      mailbox: boxes[0]?.mailbox || "",
      mailboxes: boxes.map((rec) => rec.mailbox)
    });
  }
  if (path === "/api/gmail/disconnect" && request.method === "POST") {
    let mailbox = "";
    try {
      const body = await request.json();
      mailbox = String(body.mailbox || "").trim().toLowerCase();
    } catch {
      mailbox = "";
    }
    const boxes = await listGmailMailboxes(wenv, user.email);
    const targets = mailbox ? boxes.filter((rec) => rec.mailbox.toLowerCase() === mailbox) : boxes;
    for (const rec of targets) await deleteBillsCache(wenv, user.email, rec.mailbox);
    await saveGmailToken(wenv, user.email, null, mailbox || void 0);
    const left = await listGmailMailboxes(wenv, user.email);
    return json({ ok: true, connected: left.length > 0, mailboxes: left.map((rec) => rec.mailbox) });
  }
  if (path === "/api/gmail/shopify-bills") {
    if (request.method === "GET") return listBills(request, wenv, user);
    if (request.method === "PUT") return updateMark(request, wenv);
    return json({ error: "Method not allowed" }, 405);
  }
  if (path === "/api/gmail/shopify-orders") {
    if (request.method === "GET") return listOrders(request, wenv, user);
    return json({ error: "Method not allowed" }, 405);
  }
  return json({ error: "Not found" }, 404);
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./server-BY3o_Qlj.js").then((n) => n.a5).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
function brandedErrorResponse() {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
function isCatastrophicSsrErrorBody(body, responseStatus) {
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }
  const fields = payload;
  const expectedKeys = /* @__PURE__ */ new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }
  return fields.unhandled === true && fields.message === "HTTPError" && (fields.status === void 0 || fields.status === responseStatus);
}
async function normalizeCatastrophicSsrResponse(response) {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}
const server = {
  async fetch(request, env2, ctx) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/api/app-platform") {
        return await handleAppPlatformApi(request, env2);
      }
      if (pathname === "/api/web-shield/setup") {
        return await handleWebShieldSetupApi(request);
      }
      if (pathname === "/api/namecheap/domains") {
        return await handleNamecheapApi(request, env2);
      }
      if (pathname === "/api/domain-sale") {
        return await handleDomainSaleApi(request, env2);
      }
      if (pathname.startsWith("/api/auth/")) {
        return await handleGoogleAuthApi(request, env2);
      }
      if (pathname.startsWith("/api/gmail/")) {
        return await handleGmailShopifyApi(request, env2);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env2, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  }
};
const workerEntry = server ?? {};
export {
  resolveNamecheapDomain as a,
  namecheapDaysLeft as b,
  formatNamecheapExpires as f,
  normalizeDomainKey as n,
  parseNamecheapExpires as p,
  renderErrorPage as r,
  workerEntry as w
};
