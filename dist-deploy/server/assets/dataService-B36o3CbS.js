import { S as getDefaultExportFromCjs } from "./server-CaXyqhng.js";
import require$$0 from "stream";
import { r as readSync, u as utils, S as SSF } from "./xlsx-D7D1xvpX.js";
var papaparse$1 = { exports: {} };
var papaparse = papaparse$1.exports;
var hasRequiredPapaparse;
function requirePapaparse() {
  if (hasRequiredPapaparse) return papaparse$1.exports;
  hasRequiredPapaparse = 1;
  (function(module, exports) {
    (function(root, factory) {
      {
        module.exports = factory();
      }
    })(papaparse, function moduleFactory() {
      var global = (function() {
        if (typeof self !== "undefined") {
          return self;
        }
        if (typeof window !== "undefined") {
          return window;
        }
        if (typeof global !== "undefined") {
          return global;
        }
        return {};
      })();
      function getWorkerBlob() {
        var URL = global.URL || global.webkitURL || null;
        var code = moduleFactory.toString();
        return Papa2.BLOB_URL || (Papa2.BLOB_URL = URL.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", code, ")();"], { type: "text/javascript" })));
      }
      var IS_WORKER = !global.document && !!global.postMessage, IS_PAPA_WORKER = global.IS_PAPA_WORKER || false;
      var workers = {}, workerIdCounter = 0;
      var Papa2 = {};
      Papa2.parse = CsvToJson;
      Papa2.unparse = JsonToCsv;
      Papa2.RECORD_SEP = String.fromCharCode(30);
      Papa2.UNIT_SEP = String.fromCharCode(31);
      Papa2.BYTE_ORDER_MARK = "\uFEFF";
      Papa2.BAD_DELIMITERS = ["\r", "\n", '"', Papa2.BYTE_ORDER_MARK];
      Papa2.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
      Papa2.NODE_STREAM_INPUT = 1;
      Papa2.LocalChunkSize = 1024 * 1024 * 10;
      Papa2.RemoteChunkSize = 1024 * 1024 * 5;
      Papa2.DefaultDelimiter = ",";
      Papa2.Parser = Parser;
      Papa2.ParserHandle = ParserHandle;
      Papa2.NetworkStreamer = NetworkStreamer;
      Papa2.FileStreamer = FileStreamer;
      Papa2.StringStreamer = StringStreamer;
      Papa2.ReadableStreamStreamer = ReadableStreamStreamer;
      if (typeof PAPA_BROWSER_CONTEXT === "undefined") {
        Papa2.DuplexStreamStreamer = DuplexStreamStreamer;
      }
      if (global.jQuery) {
        var $ = global.jQuery;
        $.fn.parse = function(options) {
          var config = options.config || {};
          var queue = [];
          this.each(function(idx) {
            var supported = $(this).prop("tagName").toUpperCase() === "INPUT" && $(this).attr("type").toLowerCase() === "file" && global.FileReader;
            if (!supported || !this.files || this.files.length === 0)
              return true;
            for (var i = 0; i < this.files.length; i++) {
              queue.push({
                file: this.files[i],
                inputElem: this,
                instanceConfig: $.extend({}, config)
              });
            }
          });
          parseNextFile();
          return this;
          function parseNextFile() {
            if (queue.length === 0) {
              if (isFunction(options.complete))
                options.complete();
              return;
            }
            var f = queue[0];
            if (isFunction(options.before)) {
              var returned = options.before(f.file, f.inputElem);
              if (typeof returned === "object") {
                if (returned.action === "abort") {
                  error("AbortError", f.file, f.inputElem, returned.reason);
                  return;
                } else if (returned.action === "skip") {
                  fileComplete();
                  return;
                } else if (typeof returned.config === "object")
                  f.instanceConfig = $.extend(f.instanceConfig, returned.config);
              } else if (returned === "skip") {
                fileComplete();
                return;
              }
            }
            var userCompleteFunc = f.instanceConfig.complete;
            f.instanceConfig.complete = function(results) {
              if (isFunction(userCompleteFunc))
                userCompleteFunc(results, f.file, f.inputElem);
              fileComplete();
            };
            Papa2.parse(f.file, f.instanceConfig);
          }
          function error(name, file, elem, reason) {
            if (isFunction(options.error))
              options.error({ name }, file, elem, reason);
          }
          function fileComplete() {
            queue.splice(0, 1);
            parseNextFile();
          }
        };
      }
      if (IS_PAPA_WORKER) {
        global.onmessage = workerThreadReceivedMessage;
      }
      function CsvToJson(_input, _config) {
        _config = _config || {};
        var dynamicTyping = _config.dynamicTyping || false;
        if (isFunction(dynamicTyping)) {
          _config.dynamicTypingFunction = dynamicTyping;
          dynamicTyping = {};
        }
        _config.dynamicTyping = dynamicTyping;
        _config.transform = isFunction(_config.transform) ? _config.transform : false;
        if (_config.worker && Papa2.WORKERS_SUPPORTED) {
          var w = newWorker();
          w.userStep = _config.step;
          w.userChunk = _config.chunk;
          w.userComplete = _config.complete;
          w.userError = _config.error;
          _config.step = isFunction(_config.step);
          _config.chunk = isFunction(_config.chunk);
          _config.complete = isFunction(_config.complete);
          _config.error = isFunction(_config.error);
          delete _config.worker;
          w.postMessage({
            input: _input,
            config: _config,
            workerId: w.id
          });
          return;
        }
        var streamer = null;
        if (_input === Papa2.NODE_STREAM_INPUT && typeof PAPA_BROWSER_CONTEXT === "undefined") {
          streamer = new DuplexStreamStreamer(_config);
          return streamer.getStream();
        } else if (typeof _input === "string") {
          _input = stripBom(_input);
          if (_config.download)
            streamer = new NetworkStreamer(_config);
          else
            streamer = new StringStreamer(_config);
        } else if (_input.readable === true && isFunction(_input.read) && isFunction(_input.on)) {
          streamer = new ReadableStreamStreamer(_config);
        } else if (global.File && _input instanceof File || _input instanceof Object)
          streamer = new FileStreamer(_config);
        return streamer.stream(_input);
        function stripBom(string) {
          if (string.charCodeAt(0) === 65279) {
            return string.slice(1);
          }
          return string;
        }
      }
      function JsonToCsv(_input, _config) {
        var _quotes = false;
        var _writeHeader = true;
        var _delimiter = ",";
        var _newline = "\r\n";
        var _quoteChar = '"';
        var _escapedQuote = _quoteChar + _quoteChar;
        var _skipEmptyLines = false;
        var _columns = null;
        var _escapeFormulae = false;
        unpackConfig();
        var quoteCharRegex = new RegExp(escapeRegExp(_quoteChar), "g");
        if (typeof _input === "string")
          _input = JSON.parse(_input);
        if (Array.isArray(_input)) {
          if (!_input.length || Array.isArray(_input[0]))
            return serialize(null, _input, _skipEmptyLines);
          else if (typeof _input[0] === "object")
            return serialize(_columns || Object.keys(_input[0]), _input, _skipEmptyLines);
        } else if (typeof _input === "object") {
          if (typeof _input.data === "string")
            _input.data = JSON.parse(_input.data);
          if (Array.isArray(_input.data)) {
            if (!_input.fields)
              _input.fields = _input.meta && _input.meta.fields || _columns;
            if (!_input.fields)
              _input.fields = Array.isArray(_input.data[0]) ? _input.fields : typeof _input.data[0] === "object" ? Object.keys(_input.data[0]) : [];
            if (!Array.isArray(_input.data[0]) && typeof _input.data[0] !== "object")
              _input.data = [_input.data];
          }
          return serialize(_input.fields || [], _input.data || [], _skipEmptyLines);
        }
        throw new Error("Unable to serialize unrecognized input");
        function unpackConfig() {
          if (typeof _config !== "object")
            return;
          if (typeof _config.delimiter === "string" && !Papa2.BAD_DELIMITERS.filter(function(value) {
            return _config.delimiter.indexOf(value) !== -1;
          }).length) {
            _delimiter = _config.delimiter;
          }
          if (typeof _config.quotes === "boolean" || typeof _config.quotes === "function" || Array.isArray(_config.quotes))
            _quotes = _config.quotes;
          if (typeof _config.skipEmptyLines === "boolean" || typeof _config.skipEmptyLines === "string")
            _skipEmptyLines = _config.skipEmptyLines;
          if (typeof _config.newline === "string")
            _newline = _config.newline;
          if (typeof _config.quoteChar === "string")
            _quoteChar = _config.quoteChar;
          if (typeof _config.header === "boolean")
            _writeHeader = _config.header;
          if (Array.isArray(_config.columns)) {
            if (_config.columns.length === 0) throw new Error("Option columns is empty");
            _columns = _config.columns;
          }
          if (_config.escapeChar !== void 0) {
            _escapedQuote = _config.escapeChar + _quoteChar;
          }
          if (_config.escapeFormulae instanceof RegExp) {
            _escapeFormulae = _config.escapeFormulae;
          } else if (typeof _config.escapeFormulae === "boolean" && _config.escapeFormulae) {
            _escapeFormulae = /^[=+\-@\t\r].*$/;
          }
        }
        function serialize(fields, data, skipEmptyLines) {
          var csv = "";
          if (typeof fields === "string")
            fields = JSON.parse(fields);
          if (typeof data === "string")
            data = JSON.parse(data);
          var hasHeader = Array.isArray(fields) && fields.length > 0;
          var dataKeyedByField = !Array.isArray(data[0]);
          if (hasHeader && _writeHeader) {
            for (var i = 0; i < fields.length; i++) {
              if (i > 0)
                csv += _delimiter;
              csv += safe(fields[i], i);
            }
            if (data.length > 0)
              csv += _newline;
          }
          for (var row = 0; row < data.length; row++) {
            var maxCol = hasHeader ? fields.length : data[row].length;
            var emptyLine = false;
            var nullLine = hasHeader ? Object.keys(data[row]).length === 0 : data[row].length === 0;
            if (skipEmptyLines && !hasHeader) {
              emptyLine = skipEmptyLines === "greedy" ? data[row].join("").trim() === "" : data[row].length === 1 && data[row][0].length === 0;
            }
            if (skipEmptyLines === "greedy" && hasHeader) {
              var line = [];
              for (var c = 0; c < maxCol; c++) {
                var cx = dataKeyedByField ? fields[c] : c;
                line.push(data[row][cx]);
              }
              emptyLine = line.join("").trim() === "";
            }
            if (!emptyLine) {
              for (var col = 0; col < maxCol; col++) {
                if (col > 0 && !nullLine)
                  csv += _delimiter;
                var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
                csv += safe(data[row][colIdx], col);
              }
              if (row < data.length - 1 && (!skipEmptyLines || maxCol > 0 && !nullLine)) {
                csv += _newline;
              }
            }
          }
          return csv;
        }
        function safe(str, col) {
          if (typeof str === "undefined" || str === null)
            return "";
          if (str.constructor === Date)
            return JSON.stringify(str).slice(1, 25);
          var needsQuotes = false;
          if (_escapeFormulae && typeof str === "string" && _escapeFormulae.test(str)) {
            str = "'" + str;
            needsQuotes = true;
          }
          var escapedQuoteStr = str.toString().replace(quoteCharRegex, _escapedQuote);
          needsQuotes = needsQuotes || _quotes === true || typeof _quotes === "function" && _quotes(str, col) || Array.isArray(_quotes) && _quotes[col] || hasAny(escapedQuoteStr, Papa2.BAD_DELIMITERS) || escapedQuoteStr.indexOf(_delimiter) > -1 || escapedQuoteStr.charAt(0) === " " || escapedQuoteStr.charAt(escapedQuoteStr.length - 1) === " ";
          return needsQuotes ? _quoteChar + escapedQuoteStr + _quoteChar : escapedQuoteStr;
        }
        function hasAny(str, substrings) {
          for (var i = 0; i < substrings.length; i++)
            if (str.indexOf(substrings[i]) > -1)
              return true;
          return false;
        }
      }
      function ChunkStreamer(config) {
        this._handle = null;
        this._finished = false;
        this._completed = false;
        this._halted = false;
        this._input = null;
        this._baseIndex = 0;
        this._partialLine = "";
        this._rowCount = 0;
        this._start = 0;
        this._nextChunk = null;
        this.isFirstChunk = true;
        this._completeResults = {
          data: [],
          errors: [],
          meta: {}
        };
        replaceConfig.call(this, config);
        this.parseChunk = function(chunk, isFakeChunk) {
          const skipFirstNLines = parseInt(this._config.skipFirstNLines) || 0;
          if (this.isFirstChunk && skipFirstNLines > 0) {
            let _newline = this._config.newline;
            if (!_newline) {
              const quoteChar = this._config.quoteChar || '"';
              _newline = this._handle.guessLineEndings(chunk, quoteChar);
            }
            const splitChunk = chunk.split(_newline);
            chunk = [...splitChunk.slice(skipFirstNLines)].join(_newline);
          }
          if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk)) {
            var modifiedChunk = this._config.beforeFirstChunk(chunk);
            if (modifiedChunk !== void 0)
              chunk = modifiedChunk;
          }
          this.isFirstChunk = false;
          this._halted = false;
          var aggregate = this._partialLine + chunk;
          this._partialLine = "";
          var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);
          if (this._handle.paused() || this._handle.aborted()) {
            this._halted = true;
            return;
          }
          var lastIndex = results.meta.cursor;
          if (!this._finished) {
            this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
            this._baseIndex = lastIndex;
          }
          if (results && results.data)
            this._rowCount += results.data.length;
          var finishedIncludingPreview = this._finished || this._config.preview && this._rowCount >= this._config.preview;
          if (IS_PAPA_WORKER) {
            global.postMessage({
              results,
              workerId: Papa2.WORKER_ID,
              finished: finishedIncludingPreview
            });
          } else if (isFunction(this._config.chunk) && !isFakeChunk) {
            this._config.chunk(results, this._handle);
            if (this._handle.paused() || this._handle.aborted()) {
              this._halted = true;
              return;
            }
            results = void 0;
            this._completeResults = void 0;
          }
          if (!this._config.step && !this._config.chunk) {
            this._completeResults.data = this._completeResults.data.concat(results.data);
            this._completeResults.errors = this._completeResults.errors.concat(results.errors);
            this._completeResults.meta = results.meta;
          }
          if (!this._completed && finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted)) {
            this._config.complete(this._completeResults, this._input);
            this._completed = true;
          }
          if (!finishedIncludingPreview && (!results || !results.meta.paused))
            this._nextChunk();
          return results;
        };
        this._sendError = function(error) {
          if (isFunction(this._config.error))
            this._config.error(error);
          else if (IS_PAPA_WORKER && this._config.error) {
            global.postMessage({
              workerId: Papa2.WORKER_ID,
              error,
              finished: false
            });
          }
        };
        function replaceConfig(config2) {
          var configCopy = copy(config2);
          configCopy.chunkSize = parseInt(configCopy.chunkSize);
          if (!config2.step && !config2.chunk)
            configCopy.chunkSize = null;
          this._handle = new ParserHandle(configCopy);
          this._handle.streamer = this;
          this._config = configCopy;
        }
      }
      function NetworkStreamer(config) {
        config = config || {};
        if (!config.chunkSize)
          config.chunkSize = Papa2.RemoteChunkSize;
        ChunkStreamer.call(this, config);
        var xhr;
        if (IS_WORKER) {
          this._nextChunk = function() {
            this._readChunk();
            this._chunkLoaded();
          };
        } else {
          this._nextChunk = function() {
            this._readChunk();
          };
        }
        this.stream = function(url) {
          this._input = url;
          this._nextChunk();
        };
        this._readChunk = function() {
          if (this._finished) {
            this._chunkLoaded();
            return;
          }
          xhr = new XMLHttpRequest();
          if (this._config.withCredentials) {
            xhr.withCredentials = this._config.withCredentials;
          }
          if (!IS_WORKER) {
            xhr.onload = bindFunction(this._chunkLoaded, this);
            xhr.onerror = bindFunction(this._chunkError, this);
          }
          xhr.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !IS_WORKER);
          if (this._config.downloadRequestHeaders) {
            var headers = this._config.downloadRequestHeaders;
            for (var headerName in headers) {
              xhr.setRequestHeader(headerName, headers[headerName]);
            }
          }
          if (this._config.chunkSize) {
            var end = this._start + this._config.chunkSize - 1;
            xhr.setRequestHeader("Range", "bytes=" + this._start + "-" + end);
          }
          try {
            xhr.send(this._config.downloadRequestBody);
          } catch (err) {
            this._chunkError(err.message);
          }
          if (IS_WORKER && xhr.status === 0)
            this._chunkError();
        };
        this._chunkLoaded = function() {
          if (xhr.readyState !== 4)
            return;
          if (xhr.status < 200 || xhr.status >= 400) {
            this._chunkError();
            return;
          }
          this._start += this._config.chunkSize ? this._config.chunkSize : xhr.responseText.length;
          this._finished = !this._config.chunkSize || this._start >= getFileSize(xhr);
          this.parseChunk(xhr.responseText);
        };
        this._chunkError = function(errorMessage) {
          var errorText = xhr.statusText || errorMessage;
          this._sendError(new Error(errorText));
        };
        function getFileSize(xhr2) {
          var contentRange = xhr2.getResponseHeader("Content-Range");
          if (contentRange === null) {
            return -1;
          }
          return parseInt(contentRange.substring(contentRange.lastIndexOf("/") + 1));
        }
      }
      NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
      NetworkStreamer.prototype.constructor = NetworkStreamer;
      function FileStreamer(config) {
        config = config || {};
        if (!config.chunkSize)
          config.chunkSize = Papa2.LocalChunkSize;
        ChunkStreamer.call(this, config);
        var reader, slice;
        var usingAsyncReader = typeof FileReader !== "undefined";
        this.stream = function(file) {
          this._input = file;
          slice = file.slice || file.webkitSlice || file.mozSlice;
          if (usingAsyncReader) {
            reader = new FileReader();
            reader.onload = bindFunction(this._chunkLoaded, this);
            reader.onerror = bindFunction(this._chunkError, this);
          } else
            reader = new FileReaderSync();
          this._nextChunk();
        };
        this._nextChunk = function() {
          if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
            this._readChunk();
        };
        this._readChunk = function() {
          var input = this._input;
          if (this._config.chunkSize) {
            var end = Math.min(this._start + this._config.chunkSize, this._input.size);
            input = slice.call(input, this._start, end);
          }
          var txt = reader.readAsText(input, this._config.encoding);
          if (!usingAsyncReader)
            this._chunkLoaded({ target: { result: txt } });
        };
        this._chunkLoaded = function(event) {
          this._start += this._config.chunkSize;
          this._finished = !this._config.chunkSize || this._start >= this._input.size;
          this.parseChunk(event.target.result);
        };
        this._chunkError = function() {
          this._sendError(reader.error);
        };
      }
      FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
      FileStreamer.prototype.constructor = FileStreamer;
      function StringStreamer(config) {
        config = config || {};
        ChunkStreamer.call(this, config);
        var remaining;
        this.stream = function(s) {
          remaining = s;
          return this._nextChunk();
        };
        this._nextChunk = function() {
          if (this._finished) return;
          var size = this._config.chunkSize;
          var chunk;
          if (size) {
            chunk = remaining.substring(0, size);
            remaining = remaining.substring(size);
          } else {
            chunk = remaining;
            remaining = "";
          }
          this._finished = !remaining;
          return this.parseChunk(chunk);
        };
      }
      StringStreamer.prototype = Object.create(StringStreamer.prototype);
      StringStreamer.prototype.constructor = StringStreamer;
      function ReadableStreamStreamer(config) {
        config = config || {};
        ChunkStreamer.call(this, config);
        var queue = [];
        var parseOnData = true;
        var streamHasEnded = false;
        this.pause = function() {
          ChunkStreamer.prototype.pause.apply(this, arguments);
          this._input.pause();
        };
        this.resume = function() {
          ChunkStreamer.prototype.resume.apply(this, arguments);
          this._input.resume();
        };
        this.stream = function(stream) {
          this._input = stream;
          this._input.on("data", this._streamData);
          this._input.on("end", this._streamEnd);
          this._input.on("error", this._streamError);
        };
        this._checkIsFinished = function() {
          if (streamHasEnded && queue.length === 1) {
            this._finished = true;
          }
        };
        this._nextChunk = function() {
          this._checkIsFinished();
          if (queue.length) {
            this.parseChunk(queue.shift());
          } else {
            parseOnData = true;
          }
        };
        this._streamData = bindFunction(function(chunk) {
          try {
            queue.push(typeof chunk === "string" ? chunk : chunk.toString(this._config.encoding));
            if (parseOnData) {
              parseOnData = false;
              this._checkIsFinished();
              this.parseChunk(queue.shift());
            }
          } catch (error) {
            this._streamError(error);
          }
        }, this);
        this._streamError = bindFunction(function(error) {
          this._streamCleanUp();
          this._sendError(error);
        }, this);
        this._streamEnd = bindFunction(function() {
          this._streamCleanUp();
          streamHasEnded = true;
          this._streamData("");
        }, this);
        this._streamCleanUp = bindFunction(function() {
          this._input.removeListener("data", this._streamData);
          this._input.removeListener("end", this._streamEnd);
          this._input.removeListener("error", this._streamError);
        }, this);
      }
      ReadableStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
      ReadableStreamStreamer.prototype.constructor = ReadableStreamStreamer;
      function DuplexStreamStreamer(_config) {
        var Duplex = require$$0.Duplex;
        var config = copy(_config);
        var parseOnWrite = true;
        var writeStreamHasFinished = false;
        var parseCallbackQueue = [];
        var stream = null;
        this._onCsvData = function(results) {
          var data = results.data;
          if (!stream.push(data) && !this._handle.paused()) {
            this._handle.pause();
          }
        };
        this._onCsvComplete = function() {
          stream.push(null);
        };
        config.step = bindFunction(this._onCsvData, this);
        config.complete = bindFunction(this._onCsvComplete, this);
        ChunkStreamer.call(this, config);
        this._nextChunk = function() {
          if (writeStreamHasFinished && parseCallbackQueue.length === 1) {
            this._finished = true;
          }
          if (parseCallbackQueue.length) {
            parseCallbackQueue.shift()();
          } else {
            parseOnWrite = true;
          }
        };
        this._addToParseQueue = function(chunk, callback) {
          parseCallbackQueue.push(bindFunction(function() {
            this.parseChunk(typeof chunk === "string" ? chunk : chunk.toString(config.encoding));
            if (isFunction(callback)) {
              return callback();
            }
          }, this));
          if (parseOnWrite) {
            parseOnWrite = false;
            this._nextChunk();
          }
        };
        this._onRead = function() {
          if (this._handle.paused()) {
            this._handle.resume();
          }
        };
        this._onWrite = function(chunk, encoding, callback) {
          this._addToParseQueue(chunk, callback);
        };
        this._onWriteComplete = function() {
          writeStreamHasFinished = true;
          this._addToParseQueue("");
        };
        this.getStream = function() {
          return stream;
        };
        stream = new Duplex({
          readableObjectMode: true,
          decodeStrings: false,
          read: bindFunction(this._onRead, this),
          write: bindFunction(this._onWrite, this)
        });
        stream.once("finish", bindFunction(this._onWriteComplete, this));
      }
      if (typeof PAPA_BROWSER_CONTEXT === "undefined") {
        DuplexStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
        DuplexStreamStreamer.prototype.constructor = DuplexStreamStreamer;
      }
      function ParserHandle(_config) {
        var MAX_FLOAT = Math.pow(2, 53);
        var MIN_FLOAT = -MAX_FLOAT;
        var FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
        var ISO_DATE = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
        var self2 = this;
        var _stepCounter = 0;
        var _rowCounter = 0;
        var _input;
        var _parser;
        var _paused = false;
        var _aborted = false;
        var _delimiterError;
        var _fields = [];
        var _results = {
          // The last results returned from the parser
          data: [],
          errors: [],
          meta: {}
        };
        if (isFunction(_config.step)) {
          var userStep = _config.step;
          _config.step = function(results) {
            _results = results;
            if (needsHeaderRow())
              processResults();
            else {
              processResults();
              if (_results.data.length === 0)
                return;
              _stepCounter += results.data.length;
              if (_config.preview && _stepCounter > _config.preview)
                _parser.abort();
              else {
                _results.data = _results.data[0];
                userStep(_results, self2);
              }
            }
          };
        }
        this.parse = function(input, baseIndex, ignoreLastRow) {
          var quoteChar = _config.quoteChar || '"';
          if (!_config.newline)
            _config.newline = this.guessLineEndings(input, quoteChar);
          _delimiterError = false;
          if (!_config.delimiter) {
            var delimGuess = guessDelimiter(input, _config.newline, _config.skipEmptyLines, _config.comments, _config.delimitersToGuess);
            if (delimGuess.successful)
              _config.delimiter = delimGuess.bestDelimiter;
            else {
              _delimiterError = true;
              _config.delimiter = Papa2.DefaultDelimiter;
            }
            _results.meta.delimiter = _config.delimiter;
          } else if (isFunction(_config.delimiter)) {
            _config.delimiter = _config.delimiter(input);
            _results.meta.delimiter = _config.delimiter;
          }
          var parserConfig = copy(_config);
          if (_config.preview && _config.header)
            parserConfig.preview++;
          _input = input;
          _parser = new Parser(parserConfig);
          _results = _parser.parse(_input, baseIndex, ignoreLastRow);
          processResults();
          return _paused ? { meta: { paused: true } } : _results || { meta: { paused: false } };
        };
        this.paused = function() {
          return _paused;
        };
        this.pause = function() {
          _paused = true;
          _parser.abort();
          _input = isFunction(_config.chunk) ? "" : _input.substring(_parser.getCharIndex());
        };
        this.resume = function() {
          if (self2.streamer._halted) {
            _paused = false;
            self2.streamer.parseChunk(_input, true);
          } else {
            setTimeout(self2.resume, 3);
          }
        };
        this.aborted = function() {
          return _aborted;
        };
        this.abort = function() {
          _aborted = true;
          _parser.abort();
          _results.meta.aborted = true;
          if (isFunction(_config.complete))
            _config.complete(_results);
          _input = "";
        };
        this.guessLineEndings = function(input, quoteChar) {
          input = input.substring(0, 1024 * 1024);
          var re = new RegExp(escapeRegExp(quoteChar) + "([^]*?)" + escapeRegExp(quoteChar), "gm");
          input = input.replace(re, "");
          var r = input.split("\r");
          var n = input.split("\n");
          var nAppearsFirst = n.length > 1 && n[0].length < r[0].length;
          if (r.length === 1 || nAppearsFirst)
            return "\n";
          var numWithN = 0;
          for (var i = 0; i < r.length; i++) {
            if (r[i][0] === "\n")
              numWithN++;
          }
          return numWithN >= r.length / 2 ? "\r\n" : "\r";
        };
        function testEmptyLine(s) {
          return _config.skipEmptyLines === "greedy" ? s.join("").trim() === "" : s.length === 1 && s[0].length === 0;
        }
        function testFloat(s) {
          if (FLOAT.test(s)) {
            var floatValue = parseFloat(s);
            if (floatValue > MIN_FLOAT && floatValue < MAX_FLOAT) {
              return true;
            }
          }
          return false;
        }
        function processResults() {
          if (_results && _delimiterError) {
            addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + Papa2.DefaultDelimiter + "'");
            _delimiterError = false;
          }
          if (_config.skipEmptyLines) {
            _results.data = _results.data.filter(function(d) {
              return !testEmptyLine(d);
            });
          }
          if (needsHeaderRow())
            fillHeaderFields();
          return applyHeaderAndDynamicTypingAndTransformation();
        }
        function needsHeaderRow() {
          return _config.header && _fields.length === 0;
        }
        function fillHeaderFields() {
          if (!_results)
            return;
          function addHeader(header, i2) {
            if (isFunction(_config.transformHeader))
              header = _config.transformHeader(header, i2);
            _fields.push(header);
          }
          if (Array.isArray(_results.data[0])) {
            for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
              _results.data[i].forEach(addHeader);
            _results.data.splice(0, 1);
          } else
            _results.data.forEach(addHeader);
        }
        function shouldApplyDynamicTyping(field) {
          if (_config.dynamicTypingFunction && _config.dynamicTyping[field] === void 0) {
            _config.dynamicTyping[field] = _config.dynamicTypingFunction(field);
          }
          return (_config.dynamicTyping[field] || _config.dynamicTyping) === true;
        }
        function parseDynamic(field, value) {
          if (shouldApplyDynamicTyping(field)) {
            if (value === "true" || value === "TRUE")
              return true;
            else if (value === "false" || value === "FALSE")
              return false;
            else if (testFloat(value))
              return parseFloat(value);
            else if (ISO_DATE.test(value))
              return new Date(value);
            else
              return value === "" ? null : value;
          }
          return value;
        }
        function applyHeaderAndDynamicTypingAndTransformation() {
          if (!_results || !_config.header && !_config.dynamicTyping && !_config.transform)
            return _results;
          function processRow(rowSource, i) {
            var row = _config.header ? {} : [];
            var j;
            for (j = 0; j < rowSource.length; j++) {
              var field = j;
              var value = rowSource[j];
              if (_config.header)
                field = j >= _fields.length ? "__parsed_extra" : _fields[j];
              if (_config.transform)
                value = _config.transform(value, field);
              value = parseDynamic(field, value);
              if (field === "__parsed_extra") {
                row[field] = row[field] || [];
                row[field].push(value);
              } else
                row[field] = value;
            }
            if (_config.header) {
              if (j > _fields.length)
                addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, _rowCounter + i);
              else if (j < _fields.length)
                addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, _rowCounter + i);
            }
            return row;
          }
          var incrementBy = 1;
          if (!_results.data.length || Array.isArray(_results.data[0])) {
            _results.data = _results.data.map(processRow);
            incrementBy = _results.data.length;
          } else
            _results.data = processRow(_results.data, 0);
          if (_config.header && _results.meta)
            _results.meta.fields = _fields;
          _rowCounter += incrementBy;
          return _results;
        }
        function guessDelimiter(input, newline, skipEmptyLines, comments, delimitersToGuess) {
          var bestDelim, bestDelta, fieldCountPrevRow, maxFieldCount;
          delimitersToGuess = delimitersToGuess || [",", "	", "|", ";", Papa2.RECORD_SEP, Papa2.UNIT_SEP];
          for (var i = 0; i < delimitersToGuess.length; i++) {
            var delim = delimitersToGuess[i];
            var delta = 0, avgFieldCount = 0, emptyLinesCount = 0;
            fieldCountPrevRow = void 0;
            var preview = new Parser({
              comments,
              delimiter: delim,
              newline,
              preview: 10
            }).parse(input);
            for (var j = 0; j < preview.data.length; j++) {
              if (skipEmptyLines && testEmptyLine(preview.data[j])) {
                emptyLinesCount++;
                continue;
              }
              var fieldCount = preview.data[j].length;
              avgFieldCount += fieldCount;
              if (typeof fieldCountPrevRow === "undefined") {
                fieldCountPrevRow = fieldCount;
                continue;
              } else if (fieldCount > 0) {
                delta += Math.abs(fieldCount - fieldCountPrevRow);
                fieldCountPrevRow = fieldCount;
              }
            }
            if (preview.data.length > 0)
              avgFieldCount /= preview.data.length - emptyLinesCount;
            if ((typeof bestDelta === "undefined" || delta <= bestDelta) && (typeof maxFieldCount === "undefined" || avgFieldCount > maxFieldCount) && avgFieldCount > 1.99) {
              bestDelta = delta;
              bestDelim = delim;
              maxFieldCount = avgFieldCount;
            }
          }
          _config.delimiter = bestDelim;
          return {
            successful: !!bestDelim,
            bestDelimiter: bestDelim
          };
        }
        function addError(type, code, msg, row) {
          var error = {
            type,
            code,
            message: msg
          };
          if (row !== void 0) {
            error.row = row;
          }
          _results.errors.push(error);
        }
      }
      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function Parser(config) {
        config = config || {};
        var delim = config.delimiter;
        var newline = config.newline;
        var comments = config.comments;
        var step = config.step;
        var preview = config.preview;
        var fastMode = config.fastMode;
        var quoteChar;
        var renamedHeaders = null;
        var headerParsed = false;
        if (config.quoteChar === void 0 || config.quoteChar === null) {
          quoteChar = '"';
        } else {
          quoteChar = config.quoteChar;
        }
        var escapeChar = quoteChar;
        if (config.escapeChar !== void 0) {
          escapeChar = config.escapeChar;
        }
        if (typeof delim !== "string" || Papa2.BAD_DELIMITERS.indexOf(delim) > -1)
          delim = ",";
        if (comments === delim)
          throw new Error("Comment character same as delimiter");
        else if (comments === true)
          comments = "#";
        else if (typeof comments !== "string" || Papa2.BAD_DELIMITERS.indexOf(comments) > -1)
          comments = false;
        if (newline !== "\n" && newline !== "\r" && newline !== "\r\n")
          newline = "\n";
        var cursor = 0;
        var aborted = false;
        this.parse = function(input, baseIndex, ignoreLastRow) {
          if (typeof input !== "string")
            throw new Error("Input must be a string");
          var inputLen = input.length, delimLen = delim.length, newlineLen = newline.length, commentsLen = comments.length;
          var stepIsFunction = isFunction(step);
          cursor = 0;
          var data = [], errors = [], row = [], lastCursor = 0;
          if (!input)
            return returnable();
          if (fastMode || fastMode !== false && input.indexOf(quoteChar) === -1) {
            var rows = input.split(newline);
            for (var i = 0; i < rows.length; i++) {
              row = rows[i];
              cursor += row.length;
              if (i !== rows.length - 1)
                cursor += newline.length;
              else if (ignoreLastRow)
                return returnable();
              if (comments && row.substring(0, commentsLen) === comments)
                continue;
              if (stepIsFunction) {
                data = [];
                pushRow(row.split(delim));
                doStep();
                if (aborted)
                  return returnable();
              } else
                pushRow(row.split(delim));
              if (preview && i >= preview) {
                data = data.slice(0, preview);
                return returnable(true);
              }
            }
            return returnable();
          }
          var nextDelim = input.indexOf(delim, cursor);
          var nextNewline = input.indexOf(newline, cursor);
          var quoteCharRegex = new RegExp(escapeRegExp(escapeChar) + escapeRegExp(quoteChar), "g");
          var quoteSearch = input.indexOf(quoteChar, cursor);
          for (; ; ) {
            if (input[cursor] === quoteChar) {
              quoteSearch = cursor;
              cursor++;
              for (; ; ) {
                quoteSearch = input.indexOf(quoteChar, quoteSearch + 1);
                if (quoteSearch === -1) {
                  if (!ignoreLastRow) {
                    errors.push({
                      type: "Quotes",
                      code: "MissingQuotes",
                      message: "Quoted field unterminated",
                      row: data.length,
                      // row has yet to be inserted
                      index: cursor
                    });
                  }
                  return finish();
                }
                if (quoteSearch === inputLen - 1) {
                  var value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
                  return finish(value);
                }
                if (quoteChar === escapeChar && input[quoteSearch + 1] === escapeChar) {
                  quoteSearch++;
                  continue;
                }
                if (quoteChar !== escapeChar && quoteSearch !== 0 && input[quoteSearch - 1] === escapeChar) {
                  continue;
                }
                if (nextDelim !== -1 && nextDelim < quoteSearch + 1) {
                  nextDelim = input.indexOf(delim, quoteSearch + 1);
                }
                if (nextNewline !== -1 && nextNewline < quoteSearch + 1) {
                  nextNewline = input.indexOf(newline, quoteSearch + 1);
                }
                var checkUpTo = nextNewline === -1 ? nextDelim : Math.min(nextDelim, nextNewline);
                var spacesBetweenQuoteAndDelimiter = extraSpaces(checkUpTo);
                if (input.substr(quoteSearch + 1 + spacesBetweenQuoteAndDelimiter, delimLen) === delim) {
                  row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
                  cursor = quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen;
                  if (input[quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen] !== quoteChar) {
                    quoteSearch = input.indexOf(quoteChar, cursor);
                  }
                  nextDelim = input.indexOf(delim, cursor);
                  nextNewline = input.indexOf(newline, cursor);
                  break;
                }
                var spacesBetweenQuoteAndNewLine = extraSpaces(nextNewline);
                if (input.substring(quoteSearch + 1 + spacesBetweenQuoteAndNewLine, quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen) === newline) {
                  row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
                  saveRow(quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen);
                  nextDelim = input.indexOf(delim, cursor);
                  quoteSearch = input.indexOf(quoteChar, cursor);
                  if (stepIsFunction) {
                    doStep();
                    if (aborted)
                      return returnable();
                  }
                  if (preview && data.length >= preview)
                    return returnable(true);
                  break;
                }
                errors.push({
                  type: "Quotes",
                  code: "InvalidQuotes",
                  message: "Trailing quote on quoted field is malformed",
                  row: data.length,
                  // row has yet to be inserted
                  index: cursor
                });
                quoteSearch++;
                continue;
              }
              continue;
            }
            if (comments && row.length === 0 && input.substring(cursor, cursor + commentsLen) === comments) {
              if (nextNewline === -1)
                return returnable();
              cursor = nextNewline + newlineLen;
              nextNewline = input.indexOf(newline, cursor);
              nextDelim = input.indexOf(delim, cursor);
              continue;
            }
            if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1)) {
              row.push(input.substring(cursor, nextDelim));
              cursor = nextDelim + delimLen;
              nextDelim = input.indexOf(delim, cursor);
              continue;
            }
            if (nextNewline !== -1) {
              row.push(input.substring(cursor, nextNewline));
              saveRow(nextNewline + newlineLen);
              if (stepIsFunction) {
                doStep();
                if (aborted)
                  return returnable();
              }
              if (preview && data.length >= preview)
                return returnable(true);
              continue;
            }
            break;
          }
          return finish();
          function pushRow(row2) {
            data.push(row2);
            lastCursor = cursor;
          }
          function extraSpaces(index) {
            var spaceLength = 0;
            if (index !== -1) {
              var textBetweenClosingQuoteAndIndex = input.substring(quoteSearch + 1, index);
              if (textBetweenClosingQuoteAndIndex && textBetweenClosingQuoteAndIndex.trim() === "") {
                spaceLength = textBetweenClosingQuoteAndIndex.length;
              }
            }
            return spaceLength;
          }
          function finish(value2) {
            if (ignoreLastRow)
              return returnable();
            if (typeof value2 === "undefined")
              value2 = input.substring(cursor);
            row.push(value2);
            cursor = inputLen;
            pushRow(row);
            if (stepIsFunction)
              doStep();
            return returnable();
          }
          function saveRow(newCursor) {
            cursor = newCursor;
            pushRow(row);
            row = [];
            nextNewline = input.indexOf(newline, cursor);
          }
          function returnable(stopped) {
            if (config.header && !baseIndex && data.length && !headerParsed) {
              const result = data[0];
              const headerCount = /* @__PURE__ */ Object.create(null);
              const usedHeaders = new Set(result);
              let duplicateHeaders = false;
              for (let i2 = 0; i2 < result.length; i2++) {
                let header = result[i2];
                if (isFunction(config.transformHeader))
                  header = config.transformHeader(header, i2);
                if (!headerCount[header]) {
                  headerCount[header] = 1;
                  result[i2] = header;
                } else {
                  let newHeader;
                  let suffixCount = headerCount[header];
                  do {
                    newHeader = `${header}_${suffixCount}`;
                    suffixCount++;
                  } while (usedHeaders.has(newHeader));
                  usedHeaders.add(newHeader);
                  result[i2] = newHeader;
                  headerCount[header]++;
                  duplicateHeaders = true;
                  if (renamedHeaders === null) {
                    renamedHeaders = {};
                  }
                  renamedHeaders[newHeader] = header;
                }
                usedHeaders.add(header);
              }
              if (duplicateHeaders) {
                console.warn("Duplicate headers found and renamed.");
              }
              headerParsed = true;
            }
            return {
              data,
              errors,
              meta: {
                delimiter: delim,
                linebreak: newline,
                aborted,
                truncated: !!stopped,
                cursor: lastCursor + (baseIndex || 0),
                renamedHeaders
              }
            };
          }
          function doStep() {
            step(returnable());
            data = [];
            errors = [];
          }
        };
        this.abort = function() {
          aborted = true;
        };
        this.getCharIndex = function() {
          return cursor;
        };
      }
      function newWorker() {
        if (!Papa2.WORKERS_SUPPORTED)
          return false;
        var workerUrl = getWorkerBlob();
        var w = new global.Worker(workerUrl);
        w.onmessage = mainThreadReceivedMessage;
        w.id = workerIdCounter++;
        workers[w.id] = w;
        return w;
      }
      function mainThreadReceivedMessage(e) {
        var msg = e.data;
        var worker = workers[msg.workerId];
        var aborted = false;
        if (msg.error)
          worker.userError(msg.error, msg.file);
        else if (msg.results && msg.results.data) {
          var abort = function() {
            aborted = true;
            completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
          };
          var handle = {
            abort,
            pause: notImplemented,
            resume: notImplemented
          };
          if (isFunction(worker.userStep)) {
            for (var i = 0; i < msg.results.data.length; i++) {
              worker.userStep({
                data: msg.results.data[i],
                errors: msg.results.errors,
                meta: msg.results.meta
              }, handle);
              if (aborted)
                break;
            }
            delete msg.results;
          } else if (isFunction(worker.userChunk)) {
            worker.userChunk(msg.results, handle, msg.file);
            delete msg.results;
          }
        }
        if (msg.finished && !aborted)
          completeWorker(msg.workerId, msg.results);
      }
      function completeWorker(workerId, results) {
        var worker = workers[workerId];
        if (isFunction(worker.userComplete))
          worker.userComplete(results);
        worker.terminate();
        delete workers[workerId];
      }
      function notImplemented() {
        throw new Error("Not implemented.");
      }
      function workerThreadReceivedMessage(e) {
        var msg = e.data;
        if (typeof Papa2.WORKER_ID === "undefined" && msg)
          Papa2.WORKER_ID = msg.workerId;
        if (typeof msg.input === "string") {
          global.postMessage({
            workerId: Papa2.WORKER_ID,
            results: Papa2.parse(msg.input, msg.config),
            finished: true
          });
        } else if (global.File && msg.input instanceof File || msg.input instanceof Object) {
          var results = Papa2.parse(msg.input, msg.config);
          if (results)
            global.postMessage({
              workerId: Papa2.WORKER_ID,
              results,
              finished: true
            });
        }
      }
      function copy(obj) {
        if (typeof obj !== "object" || obj === null)
          return obj;
        var cpy = Array.isArray(obj) ? [] : {};
        for (var key in obj)
          cpy[key] = copy(obj[key]);
        return cpy;
      }
      function bindFunction(f, self2) {
        return function() {
          f.apply(self2, arguments);
        };
      }
      function isFunction(func) {
        return typeof func === "function";
      }
      return Papa2;
    });
  })(papaparse$1);
  return papaparse$1.exports;
}
var papaparseExports = requirePapaparse();
const Papa = /* @__PURE__ */ getDefaultExportFromCjs(papaparseExports);
const PUB_CSV = (id, gid) => gid ? `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv&gid=${gid}` : `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv`;
const VE_BO = "2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK";
const INFO_WEB = "2PACX-1vSfZ64B_235xJjnYZwUnZYVZyDLbOcNkjuNwlaDp88lKt9mRFFVZE2BIJIzokRf5WqG4cFewXvBfIcG";
const DEFAULT_SHEET_LINKS = {
  /** Về Bờ — KPI TỔNG REG */
  GMC_REG: PUB_CSV(VE_BO, "1734827021")
};
const REG_KPI_SHEETS = [
  { id: "long", name: "Long", gid: "2106520219" },
  { id: "thinh", name: "Thịnh", gid: "239407255" },
  { id: "quoc-an", name: "Quốc An", gid: "351449929" },
  { id: "chuong", name: "Chương", gid: "1247164612" },
  { id: "bao-han", name: "Bảo Hân", gid: "741248656" }
];
const VE_BO_SHEET_ID = VE_BO;
const INFO_WEB_SHEET_ID = INFO_WEB;
const WEB_SHIELD_SHEETS = [
  { id: "shield", name: "Shield", gid: "0" },
  { id: "webshield-moi", name: "Webshield mới", gid: "1444001639" },
  { id: "web-quoc-anh", name: "Web Quốc Anh", gid: "1857507308" }
];
const LINK_REBUILD = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2/pub?output=csv&gid=724861620";
const LINK_SHOPIFY = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2/pub?output=csv&gid=173143003";
const KPI_TONG_REG_GID = "1734827021";
const resolveGmcRegLink = () => {
  const env = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK/pub?output=csv&gid=1734827021";
  if (env?.includes(`gid=${KPI_TONG_REG_GID}`)) return env;
  if (!env.includes(`gid=${KPI_TONG_REG_GID}`)) {
    console.warn("[GMC REG] VITE_LINK_TAB_GMC_REG sai tab — dùng KPI TỔNG REG mặc định");
  }
  return DEFAULT_SHEET_LINKS.GMC_REG;
};
const LINK_GMC_REG = resolveGmcRegLink();
const LINK_INVOICES_GMC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK/pub?output=csv&gid=1924031293";
const LINK_INFO_BO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6ciSNDvoFqVVBaU_Yvu_RDUV43SeQ2276pxa-ASrQty1DZSp4FnET_lDMJOZ9uPm6g2X1_9mevCCK/pub?output=csv&gid=145659602";
let cachedData = null;
let cachedAllData = null;
let cachedWebShieldData = null;
let cachedGmcRegData = null;
let cachedInfoBoData = null;
const clearInfoBoCache = () => {
  cachedInfoBoData = null;
};
function getWebStatusBucket(status) {
  const s = (status ?? "").toLowerCase().trim();
  if (s.includes("đã hoàn thành") || s.includes("da hoan thanh") || s.includes("đã set up") || s.includes("da set up") || s.includes("đã setup") || s.includes("completed") || s === "done" || s === "true") {
    return "done";
  }
  if (s.includes("cần check") || s.includes("can check") || s.includes("need check")) return "check";
  if (s.includes("chưa") || s.includes("pending") || s.includes("in progress")) return "pending";
  if (s.includes("check")) return "check";
  return "unknown";
}
function hasWebCompletionDate(r) {
  return Boolean(r.rawCompletedDate?.trim() && r.completedDate?.trim());
}
function isWebKpiRecord(r) {
  if (!hasWebCompletionDate(r) || !r.month || !r.dev?.trim()) return false;
  const b = getWebStatusBucket(r.status);
  if (b === "pending") return false;
  return b === "done" || b === "check" || b === "unknown";
}
const parseWebCompletedDate = (raw) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/);
  if (!dmy) return null;
  const d = Number(dmy[1]);
  const m = Number(dmy[2]);
  let y = dmy[3] ? Number(dmy[3]) : (/* @__PURE__ */ new Date()).getFullYear();
  if (y < 100) y += 2e3;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};
const webShieldRowVal = (row, ...keys) => {
  for (const key of keys) {
    const exact = row[key];
    if (exact != null && String(exact).trim()) return String(exact).trim();
  }
  const norm = (s) => s.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(row)) {
    if (keys.some((key) => norm(k) === norm(key)) && v != null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
};
const cleanWebShieldDomain = (raw) => {
  const line = raw.split(/\r?\n/)[0]?.trim() ?? "";
  const stripped = line.replace(/^https?:\/\//i, "");
  const match = stripped.match(/^([a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,})/);
  return (match ? match[1] : stripped.split(/\s+/)[0]).toLowerCase();
};
const parseWebShieldDate = (raw) => parseWebCompletedDate(raw);
const normalizeWebShieldDev = (raw) => {
  const d = raw.trim();
  if (!d) return "";
  if (/\d{1,2}\/\d{1,2}/.test(d)) return "";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(d)) return "";
  if (/thêm mail|kiểm|gấp/i.test(d) && !/^qa$/i.test(d)) return "";
  if (d.length > 20) return "";
  const alias = {
    long: "Long",
    duy: "Duy",
    "qúy anh": "Quý Anh",
    "quý anh": "Quý Anh",
    "quy anh": "Quý Anh"
  };
  const key = d.toLowerCase().replace(/\s+/g, " ").trim();
  if (alias[key]) return alias[key];
  if (d.toUpperCase() === "LONG") return "Long";
  if (d.toUpperCase() === "DUY") return "Duy";
  return d;
};
const WEB_SHIELD_HEADER_HINTS = [
  "web shield",
  "ngày hoàn thành",
  "tinh trang",
  "tình trạng",
  "trạng thái web",
  "check infor",
  "ngày làm"
];
const webShieldHeaderScore = (cells) => {
  const h = cells.map((c) => String(c ?? "").toLowerCase().replace(/\s+/g, " ").trim()).join(" | ");
  let score = WEB_SHIELD_HEADER_HINTS.filter((k) => h.includes(k)).length;
  if (h.includes("dev") && (h.includes("web") || h.includes("done"))) score += 2;
  if (h.includes("ngày") || h.includes("ngay")) score += 1;
  return score;
};
const rowsFromWebShieldCsv = (text) => {
  const matrix = Papa.parse(text, { header: false, skipEmptyLines: true }).data;
  if (!matrix.length) return [];
  let bestIdx = 0;
  let bestScore = -1;
  const scan = Math.min(matrix.length, 60);
  for (let i = 0; i < scan; i++) {
    const score = webShieldHeaderScore(matrix[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  const headers = (matrix[bestIdx] ?? []).map((c, i) => {
    const s = String(c ?? "").trim();
    return s || `col_${i}`;
  });
  const out = [];
  for (let i = bestIdx + 1; i < matrix.length; i++) {
    const row = {};
    const cells = matrix[i] ?? [];
    headers.forEach((h, j) => {
      row[h] = String(cells[j] ?? "");
    });
    out.push(row);
  }
  return out;
};
const parseWebShieldRows = (rows, sheetId, sheetName) => {
  const ownerKey = Object.keys(rows[0] ?? {}).find((k) => k.trim() === "") ?? " ";
  const records = [];
  for (const row of rows) {
    const rawWeb = webShieldRowVal(row, "Web Shield", "web shield", "Web");
    if (!rawWeb) continue;
    const web = cleanWebShieldDomain(rawWeb);
    if (!web) continue;
    const tinhTrang = webShieldRowVal(row, "tình trạng", "tinh trang", "Tình Trạng", "Done");
    const ngay = webShieldRowVal(
      row,
      "Ngày Hoàn Thành",
      "Ngay Hoan Thanh",
      "Ngày hoàn thành",
      "Ngày",
      "ngày"
    );
    const completedDate = parseWebShieldDate(ngay) ?? parseWebShieldDate(tinhTrang);
    const dev = normalizeWebShieldDev(webShieldRowVal(row, "Dev", "dev"));
    records.push({
      sheetId,
      sheetName,
      owner: (row[ownerKey] ?? "").trim(),
      web,
      rawWeb,
      checkInfor: webShieldRowVal(row, "Check Infor"),
      email: webShieldRowVal(row, "Email", "Tên LLC"),
      address: webShieldRowVal(row, "Địa CHỉ", "Địa CHỈ", "Địa Chỉ", "Dia CHI"),
      cong: webShieldRowVal(row, "Cổng", "Công"),
      tinhTrang,
      dev,
      webStatus: webShieldRowVal(row, "Trạng thái web", "Trang thai web", "Done"),
      ngay,
      completedDate,
      month: completedDate ? completedDate.slice(0, 7) : null
    });
  }
  return records;
};
const getWebShieldData = async (forceRefresh = false) => {
  if (cachedWebShieldData && !forceRefresh) {
    return cachedWebShieldData;
  }
  try {
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const batches = await Promise.all(
      WEB_SHIELD_SHEETS.map(async (sheet) => {
        const baseUrl = `https://docs.google.com/spreadsheets/d/e/${INFO_WEB_SHEET_ID}/pub?output=csv&gid=${sheet.gid}`;
        const separator = baseUrl.includes("?") ? "&" : "?";
        const csv = await fetch(`${baseUrl}${separator}t=${timestamp}`, { cache: "no-store" }).then((r) => r.text());
        const rows = rowsFromWebShieldCsv(csv);
        return parseWebShieldRows(rows, sheet.id, sheet.name);
      })
    );
    cachedWebShieldData = batches.flat();
    return cachedWebShieldData;
  } catch (error) {
    console.error("Web Shield fetch error:", error);
    return [];
  }
};
const getAllDataWeb = async (forceRefresh = false) => {
  if (cachedAllData && !forceRefresh) {
    return cachedAllData;
  }
  try {
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const separatorRebuild = LINK_REBUILD.includes("?") ? "&" : "?";
    const resRebuild = await fetch(`${LINK_REBUILD}${separatorRebuild}t=${timestamp}`, {
      cache: "no-store"
    }).then((r) => r.text());
    const rows = Papa.parse(resRebuild, {
      header: true,
      skipEmptyLines: true
    }).data;
    const records = [];
    for (const row of rows) {
      const domain = (row["Tên Domain"] ?? "").trim().toLowerCase();
      if (!domain) continue;
      const dev = (row["Tên Dev"] ?? "").trim();
      const status = (row["Đã hoàn thành"] ?? "").trim();
      const webType = (row["Loại web"] ?? "").trim();
      const rawDate = (row["Ngày hoàn thành"] ?? "").trim();
      const completedDate = parseWebCompletedDate(rawDate);
      const month = completedDate ? completedDate.slice(0, 7) : null;
      records.push({ domain, dev, completedDate, rawCompletedDate: rawDate, month, status, webType });
    }
    const byDomainMonth = /* @__PURE__ */ new Map();
    const latestByDomain = /* @__PURE__ */ new Map();
    for (const r of records) {
      latestByDomain.set(r.domain, r);
      if (!r.completedDate || !r.month) continue;
      const key = `${r.domain}|${r.month}`;
      const prev = byDomainMonth.get(key);
      if (!prev) {
        byDomainMonth.set(key, r);
      } else if (isWebKpiRecord(r) || !isWebKpiRecord(prev)) {
        byDomainMonth.set(key, r);
      }
    }
    const out = [...byDomainMonth.values()];
    const datedDomains = new Set(out.map((r) => r.domain));
    for (const r of latestByDomain.values()) {
      if (!r.completedDate && !datedDomains.has(r.domain)) out.push(r);
    }
    cachedAllData = out;
    return cachedAllData;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};
const getLatestWebData = async (forceRefresh = false) => {
  if (cachedData && !forceRefresh) return cachedData;
  try {
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const separatorRebuild = LINK_REBUILD.includes("?") ? "&" : "?";
    const separatorShopify = LINK_SHOPIFY.includes("?") ? "&" : "?";
    const [resRebuild, resShopify] = await Promise.all([
      fetch(`${LINK_REBUILD}${separatorRebuild}t=${timestamp}`).then((r) => r.text()),
      fetch(`${LINK_SHOPIFY}${separatorShopify}t=${timestamp}`).then((r) => r.text())
    ]);
    const rebuildRows = Papa.parse(resRebuild, { header: true, skipEmptyLines: true }).data;
    const shopifyRows = Papa.parse(resShopify, { header: true, skipEmptyLines: true }).data;
    const rebuildMap = /* @__PURE__ */ new Map();
    rebuildRows.forEach((row) => {
      const domainName = row["Tên Domain"]?.trim();
      if (domainName) {
        rebuildMap.set(domainName.toLowerCase(), row);
      }
    });
    const latestRebuildData = Array.from(rebuildMap.values());
    const shopifyMap = /* @__PURE__ */ new Map();
    shopifyRows.forEach((row) => {
      const domainName = row["Web Shopify"]?.trim();
      if (domainName) {
        shopifyMap.set(domainName.toLowerCase(), row);
      }
    });
    const combined = latestRebuildData.map((r) => {
      const domainName = r["Tên Domain"].trim().toLowerCase();
      const s = shopifyMap.get(domainName);
      const daysLeft = parseInt(r["DaysLeft"]) || 0;
      return {
        domain: r["Tên Domain"].trim(),
        regBy: r["Tên Reg"] || "—",
        expiryDateSheet: r["Hạn Domain"] || "—",
        daysLeft,
        dev: r["Tên Dev"] || "—",
        customer: r["LLC"] || "—",
        type: r["Loại web"] || "—",
        isFinished: r["Đã hoàn thành"] === "Đã hoàn thành" || r["Đã hoàn thành"] === "TRUE",
        startDate: s ? s["Ngày Đăng kí"] : "—",
        expiryDateShopify: s ? s["Ngày hết hạn 1$"] : "—",
        isCanceled: s ? s["Đã hủy plan"] === "Đã hủy" || s["Đã hủy plan"] === "TRUE" : false,
        webhookStatus: s ? (s["Thay webhooks"] || "").trim() : "",
        isHuyRegMoi: s ? s["WEB Hủy reg mới"] === "Hủy" || s["WEB Hủy reg mới"] === "Đang xài" : false,
        rebuildCount: r["Số lần làm lại web"] || "0"
      };
    });
    cachedData = combined;
    return combined;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};
let cachedTongHopWeb = null;
const getTongHopWebRegs = async (forceRefresh = false) => {
  if (cachedTongHopWeb && !forceRefresh) return cachedTongHopWeb;
  try {
    const ts = Date.now();
    const sep = LINK_REBUILD.includes("?") ? "&" : "?";
    const text = await fetch(`${LINK_REBUILD}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
    const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
    const map = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const domain = String(row["Tên Domain"] ?? "").trim();
      const tenReg = String(row["Tên Reg"] ?? "").trim();
      if (!domain) continue;
      map.set(domain.toLowerCase(), { domain, tenReg: tenReg || "—" });
    }
    cachedTongHopWeb = [...map.values()];
    return cachedTongHopWeb;
  } catch (error) {
    console.error("getTongHopWebRegs error:", error);
    return [];
  }
};
const gmcRegRowVal = (row, ...keys) => {
  for (const key of keys) {
    const val = row[key];
    if (val !== void 0 && val !== null && String(val).trim() !== "") {
      return cleanCell(String(val));
    }
  }
  const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/\s+/g, " ").trim());
  for (const [rawKey, val] of Object.entries(row)) {
    const nk = rawKey.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalizedKeys.some((k) => nk === k || nk.includes(k))) {
      const s = cleanCell(String(val ?? ""));
      if (s) return s;
    }
  }
  return "";
};
const gmcRegExact = (row, ...keys) => {
  const wanted = new Set(keys.map((k) => k.toLowerCase().replace(/\s+/g, " ").trim()));
  for (const [rawKey, val] of Object.entries(row)) {
    const nk = rawKey.toLowerCase().replace(/\s+/g, " ").trim();
    if (!wanted.has(nk)) continue;
    const s = cleanCell(String(val ?? ""));
    if (s) return s;
  }
  return "";
};
const gmcWebVal = (row) => {
  for (const key of ["WEB", "Web"]) {
    const val = row[key];
    if (val !== void 0 && val !== null && String(val).trim() !== "") {
      return cleanCell(String(val)).toLowerCase();
    }
  }
  return "";
};
const PLATFORM_WORDS = /* @__PURE__ */ new Set(["shopify", "wordpress", "woocommerce", "unknown", "web", "n/a", "na"]);
const isValidGmcWebDomain = (domain) => {
  const d = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (!d || PLATFORM_WORDS.has(d)) return false;
  if (!d.includes(".")) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(d);
};
const getGMCRegData = async (forceRefresh = false) => {
  if (cachedGmcRegData && !forceRefresh) return cachedGmcRegData;
  try {
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const separator = LINK_GMC_REG.includes("?") ? "&" : "?";
    const res = await fetch(`${LINK_GMC_REG}${separator}t=${timestamp}`, { cache: "no-store" }).then((r) => r.text());
    const rows = Papa.parse(res, { header: true, skipEmptyLines: true }).data;
    const formattedData = rows.map((r) => ({
      proxy: gmcRegRowVal(r, "Proxy"),
      proxyExpiry: gmcRegRowVal(r, "Hạn Proxy", "Hạn Proxy Phú") || "—",
      twoFA: gmcRegRowVal(r, "2FA") || "—",
      domain: gmcWebVal(r),
      dateGMC: gmcRegRowVal(r, "Ngày về GMC", "Ngày Reg GMC") || "—",
      reportDateGMC: gmcRegRowVal(r, "Báo cáo ngày về") || "—",
      webType: gmcRegRowVal(r, "Loại web") || "—",
      status: gmcRegRowVal(r, "Tình Trạng Sus", "Tình trạng Sus") || "Xanh",
      // KPI TỔNG REG: cột REG = người đăng ký; cột DEV = người làm web
      dev: gmcRegRowVal(r, "REG", "Người Reg", "Tên Reg"),
      webDev: gmcRegExact(r, "DEV"),
      adsDate: gmcRegRowVal(r, "Ngày chạy Ads") || "—",
      linkAdsEgead: gmcRegRowVal(r, "Link ads vs egead", "Báo cáo ngày link ads vs egead") || "—",
      dateSus: gmcRegRowVal(r, "Ngày Sus") || "—",
      reportDateSus: gmcRegRowVal(r, "Báo cáo ngày sus", "Báo cáo ngày Sus") || "—",
      cost: gmcRegRowVal(r, "Chi Phí", "Chi phí") || "0",
      daysGreen: gmcRegRowVal(r, "Số ngày GMC", "Số ngày GMC XANH", "Số ngày GMC xanh") || "—",
      thayCong: gmcRegRowVal(r, "Thay Cổng paypal", "Thay Cổng", "Thay cổng") || "—",
      note: gmcRegRowVal(r, "Note") || ""
    }));
    const validData = formattedData.filter((item) => isValidGmcWebDomain(item.domain));
    cachedGmcRegData = validData;
    return validData;
  } catch (error) {
    console.error("GMC REG (KPI TỔNG REG) fetch error:", error);
    return [];
  }
};
const foldViStatus = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
const parseGmcSusKind = (status) => {
  const raw = (status ?? "").trim();
  if (!raw || raw === "—") return "live";
  const s = foldViStatus(raw);
  if (!s || s === "xanh" || s.includes("chua sus")) return "live";
  if (s.includes("da khang lai mail") || s.includes("khang lai mail")) return "appealed_mail";
  if (s.includes("dang khang mail")) return "appealing_mail";
  if (s.includes("sus mail")) return "sus_mail";
  if (s.includes("sus") || s === "die" || s.includes("ve sus")) return "sus";
  return "live";
};
const parseRefundStatus = (raw) => {
  const s = (raw ?? "").toLowerCase().normalize("NFC").trim();
  if (!s) return "none";
  if (s.includes("đã hoàn") || s.includes("da hoan") || s === "hoàn" || s === "hoan") return "refunded";
  if (s.includes("chờ hoàn") || s.includes("cho hoan") || s.includes("chờ hoàn tiền") || s.includes("hoàn tiền") || s.includes("hoan tien") || s.includes("chờ")) return "pending";
  return "none";
};
const expenseRowVal = (row, ...keys) => {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  for (const key of keys) {
    const exact = row[key];
    if (exact != null && String(exact).trim()) return cleanCell(String(exact));
  }
  for (const [k, v] of Object.entries(row)) {
    if (keys.some((key) => norm(k) === norm(key)) && v != null && String(v).trim()) {
      return cleanCell(String(v));
    }
  }
  return "";
};
let cachedChiPhiExpenses = null;
let cachedShopifyData = null;
let cachedRegKpiData = null;
const cleanCell = (val) => (val ?? "").normalize("NFC").replace(/[\u00A0\uFEFF\u200B"'\r]/g, "").trim();
const parseUSD = (val) => {
  if (!val) return 0;
  let normalized = val.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized.includes("vnd") || normalized.includes("₫") || /\bđ\b/.test(normalized) || normalized.includes("usdt")) {
    return 0;
  }
  normalized = normalized.replace(/\$/g, "").replace(/\busd\b/g, "").trim();
  let multiply = 1;
  const kMatch = normalized.match(/^([\d.,]+)\s*k$/);
  if (kMatch) {
    normalized = kMatch[1];
    multiply = 1e3;
  }
  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(/,/g, ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  const numberValue = parseFloat(normalized);
  return isNaN(numberValue) ? 0 : numberValue * multiply;
};
const parseVND = (val) => {
  if (!val) return 0;
  const trimmed = val.trim().toLowerCase().replace(/\s+/g, " ");
  if (trimmed.includes("usdt") || trimmed.includes("usd") || trimmed.includes("$")) return 0;
  const vndMatch = trimmed.match(/^([\d.,]+)\s*(vnd|₫|đ)$/);
  if (vndMatch) {
    const n = parseFloat(vndMatch[1].replace(/,/g, "."));
    return isNaN(n) ? 0 : n * 1e3;
  }
  return 0;
};
const parseUSDT = (val) => {
  if (!val) return 0;
  const trimmed = val.trim().toLowerCase();
  const usdtMatch = trimmed.match(/^([\d.,]+)\s*usdt$/);
  if (usdtMatch) {
    let numStr = usdtMatch[1];
    if (numStr.includes(",") && !numStr.includes(".")) {
      numStr = numStr.replace(/,/g, ".");
    }
    const n = parseFloat(numStr);
    return isNaN(n) ? 0 : n;
  }
  return 0;
};
const parseMonth = (raw) => {
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0, 7);
  return null;
};
const mapExpenseRow = (row) => {
  const loaiChiPhi = expenseRowVal(
    row,
    "Tên chi phí",
    "Ten chi phi",
    "Loại chi phí",
    "Loai chi phi",
    "Type",
    "Expense type"
  );
  const registrant = expenseRowVal(row, "Tên Reg", "Ten Reg", "Người Reg", "Nguoi Reg", "Registrant");
  const rawAmount = expenseRowVal(
    row,
    "Chi phí (USD)",
    "Chi phí USD",
    "Chi phi (USD)",
    "Chi phí",
    "Chi phi",
    "Amount",
    "Số tiền",
    "So tien"
  );
  const ngayTT = expenseRowVal(
    row,
    "Ngày thanh toán",
    "Ngay thanh toan",
    "Payment date",
    "Date",
    "Ngày"
  );
  const choHoanTien = expenseRowVal(row, "Chờ Hoàn tiền", "Chờ hoàn tiền", "Cho Hoan tien", "Refund");
  if (!loaiChiPhi || !registrant) return null;
  if (!rawAmount && !choHoanTien) return null;
  return {
    tenReg: registrant,
    loaiChiPhi,
    ngayThanhToan: ngayTT,
    tenWeb: expenseRowVal(row, "Tên web", "Ten web", "Web", "Website"),
    tenTheAds: expenseRowVal(row, "Tên thẻ ads", "Ten the ads", "Thẻ ads", "Ads card"),
    dangThe: expenseRowVal(row, "Dạng thẻ", "Dạng thẻ ", "Dong the", "Card type"),
    chiPhiUSD: parseUSD(rawAmount),
    chiPhiVND: parseVND(rawAmount),
    chiPhiUSDT: parseUSDT(rawAmount),
    chiPhiRaw: rawAmount,
    choHoanTien,
    refundStatus: parseRefundStatus(choHoanTien),
    billChiPhi: expenseRowVal(row, "Bill chi phí", "Bill"),
    month: parseMonth(ngayTT)
  };
};
const parseExpensesFromCsvText = (text) => {
  const rows = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;
  const expenses = [];
  for (const row of rows) {
    const mapped = mapExpenseRow(row);
    if (mapped) expenses.push(mapped);
  }
  return expenses;
};
const normExpenseText = (s) => (s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").replace(/đăng kí/g, "đăng ký").trim();
const normExpenseDate = (raw) => {
  const s = (raw ?? "").trim();
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return normExpenseText(s);
};
const roundMoney = (n) => Math.round((n || 0) * 100) / 100;
const expenseMatchKey = (e, strict = true) => {
  const base = [
    normExpenseText(e.tenReg),
    normExpenseText(e.loaiChiPhi),
    normExpenseDate(e.ngayThanhToan),
    `u${roundMoney(e.chiPhiUSD)}`,
    `v${roundMoney(e.chiPhiVND)}`,
    `t${roundMoney(e.chiPhiUSDT)}`
  ];
  if (strict) {
    base.push(normExpenseText(e.tenWeb), normExpenseText(e.tenTheAds));
  }
  return base.join("|");
};
const reconcileExpensesAgainstGmc = (uploaded, gmc) => {
  const remaining = gmc.map((e) => ({ e, used: false }));
  const takeMatch = (u) => {
    const hard = expenseMatchKey(u, true);
    let hit = remaining.find((r) => !r.used && expenseMatchKey(r.e, true) === hard);
    if (!hit) {
      const soft = expenseMatchKey(u, false);
      hit = remaining.find((r) => !r.used && expenseMatchKey(r.e, false) === soft);
    }
    if (!hit) return false;
    hit.used = true;
    return true;
  };
  const missing = [];
  const matched = [];
  for (const e of uploaded) {
    if (takeMatch(e)) matched.push(e);
    else missing.push(e);
  }
  const matchedUsd = roundMoney(matched.reduce((s, e) => s + (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0), 0));
  const missingUsd = roundMoney(missing.reduce((s, e) => s + (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0), 0));
  return {
    uploadedCount: uploaded.length,
    matchedCount: matched.length,
    matched,
    matchedUsd,
    missing,
    missingUsd,
    missingVnd: missing.reduce((s, e) => s + (e.chiPhiVND || 0), 0),
    missingUsdt: missing.reduce((s, e) => s + (e.chiPhiUSDT || 0), 0),
    totalUsd: roundMoney(matchedUsd + missingUsd),
    gmcCount: gmc.length
  };
};
const cardRowVal = (row, ...keys) => expenseRowVal(row, ...keys);
const parseMoneyCell = (raw) => {
  if (!raw) return 0;
  let s = raw.trim().replace(/\$/g, "").replace(/,/g, "").replace(/\s+/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};
const extractCardLast4 = (cardNo) => {
  const digits = (cardNo || "").replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  const star = (cardNo || "").match(/\*{2,}(\d{4})/);
  return star ? star[1] : "";
};
const rowValIncludes = (row, ...needles) => {
  const exact = cardRowVal(row, ...needles);
  if (exact) return exact;
  const n = needles.map((s) => s.toLowerCase());
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    const lk = k.toLowerCase().replace(/\s+/g, " ");
    if (n.some((needle) => lk.includes(needle))) return cleanCell(v);
  }
  return "";
};
const parsePaymentInstrument = (raw) => {
  const s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return { cardName: "", cardNo: "", last4: "" };
  const afterCard = s.replace(/^card:\s*/i, "");
  const parts = afterCard.split(",").map((p) => p.trim()).filter(Boolean);
  const cardName = (parts[0] || "").trim();
  const maskPart = parts.find((p) => /\*+\s*\d+/.test(p)) || "";
  const maskMatch = maskPart.match(/\*+\s*(\d{2,6})/) ?? s.match(/\*{2,}\s*(\d{2,6})/);
  const last4 = maskMatch?.[1] ?? extractCardLast4(s);
  return {
    cardName,
    cardNo: last4 ? `**${last4}` : "",
    last4
  };
};
const headerBlob = (headers) => headers.map((x) => String(x ?? "").toLowerCase().replace(/\s+/g, " ").trim()).join(" | ");
const isAirwallexHeaders = (headers) => {
  const h = headerBlob(headers);
  return h.includes("financial account id") || h.includes("estimated settlement") || h.includes("beneficiary name") && h.includes("settlement currency") || h.includes("net amount") && h.includes("payment instrument");
};
const isCardTxnHeaders = (headers) => {
  const h = headerBlob(headers);
  return h.includes("transaction id") || h.includes("merchant name") && h.includes("billing amount") || h.includes("card nickname") && h.includes("transaction amount") || isAirwallexHeaders(headers);
};
const HEADER_HINTS = [
  "transaction id",
  "merchant name",
  "billing amount",
  "card nickname",
  "financial account id",
  "settlement currency",
  "beneficiary name",
  "estimated settlement",
  "net amount",
  "payment instrument",
  "payment method",
  "transaction amount",
  "created at",
  "tên chi phí",
  "ngày thanh toán",
  "tên reg"
];
const rowHeaderScore = (cells) => {
  const h = headerBlob(cells.map((c) => String(c ?? "")));
  return HEADER_HINTS.filter((k) => h.includes(k)).length;
};
const rowsFromMatrix = (matrix) => {
  if (!matrix.length) return [];
  let bestIdx = 0;
  let bestScore = -1;
  const scan = Math.min(matrix.length, 25);
  for (let i = 0; i < scan; i++) {
    const score = rowHeaderScore(matrix[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  const headers = (matrix[bestIdx] ?? []).map((c) => cellToString(c).trim());
  const out = [];
  for (let r = bestIdx + 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const obj = {};
    let any = false;
    headers.forEach((h, i) => {
      if (!h) return;
      const val = cellToString(line[i]).trim();
      if (obj[h]) return;
      obj[h] = val;
      if (val) any = true;
    });
    if (any) out.push(obj);
  }
  return out;
};
const isCardTxnCsv = (text) => {
  const lines = text.split(/\r?\n/).slice(0, 20);
  return lines.some((l) => l.trim() && isCardTxnHeaders(l.split(/[,;\t]/)));
};
const formatDisplayDate = (d) => {
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  if (d.getHours() || d.getMinutes() || d.getSeconds()) {
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }
  return `${dd}/${mm}/${yyyy}`;
};
const cellToString = (v) => {
  if (v == null) return "";
  if (v instanceof Date) return formatDisplayDate(v);
  if (typeof v === "number") {
    if (Number.isFinite(v) && v > 2e4 && v < 8e4) {
      const parsed = SSF.parse_date_code(v);
      if (parsed) {
        const d = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
        return formatDisplayDate(d);
      }
    }
    if (Number.isFinite(v) && Math.abs(v) >= 1e12) return Math.trunc(v).toString();
    return String(v);
  }
  return String(v);
};
const parseExcelRows = async (file) => {
  const buf = file instanceof File ? await file.arrayBuffer() : file;
  const wb = readSync(buf, { type: "array", cellDates: true, raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const matrix = utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  });
  return rowsFromMatrix(matrix);
};
const parseCardTxnRows = (rows) => {
  const out = [];
  for (const row of rows) {
    const mapped = mapCardTxnRow(row);
    if (mapped) out.push(mapped);
  }
  return out;
};
const parseExpenseRows = (rows) => {
  const out = [];
  for (const row of rows) {
    const mapped = mapExpenseRow(row);
    if (mapped) out.push(mapped);
  }
  return out;
};
const mapCardTxnRow = (row) => {
  const transactionId = cardRowVal(row, "Transaction ID", "Transaction Id", "Txn ID");
  const amountRaw = cardRowVal(
    row,
    "Billing Amount",
    "Transaction Amount",
    "Billing Amount (at settlement)",
    "Net Amount"
  );
  const netRaw = cardRowVal(row, "Net Amount");
  const feeRaw = cardRowVal(row, "Fee");
  if (!transactionId && !amountRaw && !netRaw && !feeRaw) return null;
  const amountAbs = Math.abs(parseMoneyCell(amountRaw || netRaw || feeRaw));
  const reversalAmount = Math.abs(parseMoneyCell(cardRowVal(row, "Reversal Amount")));
  const netFromCol = parseMoneyCell(netRaw);
  const netAmount = netRaw ? Math.max(0, roundMoney(Math.abs(netFromCol))) : Math.max(0, roundMoney(amountAbs - reversalAmount));
  const instrumentRaw = rowValIncludes(row, "Payment Method") || rowValIncludes(
    row,
    "Payment Instrument",
    "Card Name",
    "Cardholder",
    "Card Holder",
    "Tên thẻ",
    "Ten the"
  );
  const parsedInst = parsePaymentInstrument(instrumentRaw);
  const cardNo = cardRowVal(row, "Card No.", "Card No", "Card Number") || parsedInst.cardNo;
  const cardNickname = cardRowVal(row, "Card Nickname", "Nickname", "Card Name") || parsedInst.cardName || instrumentRaw;
  const merchantName = cardRowVal(row, "Merchant Name", "Merchant", "Beneficiary Name") || cardRowVal(row, "Note to Self", "Note", "Reference") || cardNickname;
  let transactionDate = cardRowVal(
    row,
    "Transaction Time",
    "Transaction Date",
    "Txn Time",
    "Txn Date",
    "Created At",
    "Create Time",
    "Posted Date",
    "Settlement Date",
    "Settled At",
    "Date",
    "Ngày giao dịch",
    "Thời gian",
    "Ngay giao dich"
  );
  if (!transactionDate) {
    for (const [k, v] of Object.entries(row)) {
      const lk = k.toLowerCase();
      if (v && (lk.includes("time") || lk.includes("date") || lk.includes("ngày") || lk.includes("ngay"))) {
        transactionDate = String(v).trim();
        break;
      }
    }
  }
  const typeRaw = cardRowVal(row, "Transaction Type", "Type");
  const typeLower = typeRaw.toLowerCase();
  const transactionType = typeLower === "card" || typeLower === "fee" || typeLower.includes("payment") ? "Expense" : typeRaw;
  return {
    cardId: cardRowVal(row, "Card ID", "Card Id", "Financial Account ID"),
    product: cardRowVal(row, "Product"),
    productName: cardRowVal(row, "Product Name"),
    transactionId: transactionId || `${cardNo}-${amountAbs}`,
    cardNo,
    cardLast4: parsedInst.last4 || extractCardLast4(cardNo),
    cardNickname,
    cardName: parsedInst.cardName || cardNickname,
    transactionType,
    status: cardRowVal(row, "Status"),
    currency: (cardRowVal(row, "Billing Currency", "Settlement Currency", "Transaction Currency") || "USD").toUpperCase(),
    amount: amountAbs,
    reversalAmount,
    netAmount,
    merchantName,
    mcc: cardRowVal(row, "MCC"),
    transactionDate
  };
};
const isCountableCardTxn = (t) => {
  const type = t.transactionType.toLowerCase();
  const status = t.status.toLowerCase();
  if (type.includes("deposit") || type.includes("top up") || type.includes("topup") || type.includes("nạp") || type.includes("payout") || type.includes("transfer in")) {
    return false;
  }
  if (type && !type.includes("expense") && !type.includes("chi") && !type.includes("card") && !type.includes("fee") && !type.includes("payment")) {
    return false;
  }
  if (status.includes("fail") || status.includes("decline") || status.includes("cancel") || status.includes("void")) {
    return false;
  }
  if (status && !status.includes("success") && !status.includes("process") && !status.includes("settled") && !status.includes("pending") && status !== "") {
    return false;
  }
  if (t.netAmount <= 0) return false;
  return true;
};
const parseCardTxnCsvText = (text) => {
  const matrix = Papa.parse(text, { header: false, skipEmptyLines: true }).data;
  return parseCardTxnRows(rowsFromMatrix(matrix));
};
const gmcUsdAmount = (e) => roundMoney((e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0));
const gmcMerchantBlob = (e) => `${e.loaiChiPhi} ${e.tenWeb} ${e.chiPhiRaw}`.toLowerCase();
const gmcHasLast4 = (e, last4) => {
  if (!last4) return false;
  const blob = `${e.tenTheAds} ${e.dangThe} ${e.chiPhiRaw} ${e.tenWeb} ${e.billChiPhi}`;
  return blob.replace(/\D/g, "").includes(last4) || blob.includes(last4);
};
const isGoogleAdsMerchant = (merchant) => {
  const m = (merchant || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!m) return false;
  if (m.includes("adwords")) return true;
  if (!m.includes("google")) return false;
  if (m.includes("ads") || /\bgoogle\s*ad\b/.test(m)) return true;
  if (/^google\s*\*?\s*$/.test(m)) return true;
  if (/google\s*\*/.test(m) && !/cloud|workspace|gsuite|youtube|storage|play|one|domains/.test(m)) {
    return true;
  }
  return false;
};
const merchantFamily = (merchant) => {
  const m = merchant.toLowerCase().replace(/\s+/g, " ");
  if (m.includes("shopify")) return "shopify";
  if (m.includes("name-cheap") || m.includes("namecheap") || m.includes("name cheap") || m.includes("godaddy") || m.includes("cloudflare")) {
    return "domain";
  }
  if (m.includes("txvrfy") || m.includes("textverify") || m.includes("txv*")) return "textverify";
  if (m.includes("rayobyte") || m.includes("rayo") || m.includes("proxy") || m.includes("brightdata") || m.includes("smartproxy")) {
    return "proxy";
  }
  if (m.includes("cursor")) return "cursor";
  if (m.includes("capcut") || m.includes("cap cut")) return "capcut";
  if (isGoogleAdsMerchant(merchant)) return "ads";
  if (m.includes("facebook") || m.includes("meta ads") || m.includes("tiktok")) return "ads";
  if (m.includes("etsy") || m.includes("ebay")) return "other";
  if (m.includes("mail") || m.includes("outlook") || m.includes("gmail")) return "mail";
  return "other";
};
const merchantKeywords = (merchant) => {
  const raw = (merchant || "").trim();
  if (!raw) return [];
  const star = raw.indexOf("*");
  const head = (star >= 0 ? raw.slice(0, star) : raw.split(/\s+/)[0] || "").trim().toLowerCase();
  if (!head) return [];
  const keys = /* @__PURE__ */ new Set();
  keys.add(head);
  keys.add(head.replace(/[^a-z0-9]/g, ""));
  head.split(/[^a-z0-9]+/).forEach((p) => {
    if (p.length >= 4) keys.add(p);
  });
  return [...keys].filter((k) => k.length >= 3);
};
const keywordInGmc = (keywords, e) => {
  if (!keywords.length) return false;
  const blob = gmcMerchantBlob(e);
  const compact = blob.replace(/[^a-z0-9]/g, "");
  return keywords.some((k) => {
    const ck = k.replace(/[^a-z0-9]/g, "");
    if (ck.length < 5 && !["cursor", "proxy", "txv"].includes(ck)) return false;
    return blob.includes(k) || ck.length >= 5 && compact.includes(ck);
  });
};
const merchantGmcScore = (family, merchant, e) => {
  const blob = gmcMerchantBlob(e);
  const loai = (e.loaiChiPhi || "").toLowerCase();
  const keys = merchantKeywords(merchant);
  if (keywordInGmc(keys, e)) return 100;
  switch (family) {
    case "textverify":
      if (loai.includes("textverify") || loai.includes("text verify") || loai.includes("nạp text")) return 100;
      if (blob.includes("textverify") || blob.includes("txv") || blob.includes("nạp text")) return 90;
      if (blob.includes("text")) return 40;
      return 0;
    case "proxy":
      if (loai.includes("proxy") || blob.includes("rayobyte") || blob.includes("proxy")) return 100;
      return 0;
    case "domain":
      if (loai.includes("mua domain") || loai === "domain") return 100;
      if (loai.includes("domain") || blob.includes("namecheap") || blob.includes("name-cheap")) return 100;
      return 0;
    case "shopify":
      if (loai.includes("shopify") || loai.includes("host shopify") || loai.includes("tiền host")) return 100;
      if (blob.includes("host shopify") || blob.includes("tiền host")) return 100;
      if (/\bshopify\b/.test(blob) && !loai.includes("domain") && !loai.includes("ads")) return 80;
      return 0;
    case "ads":
      if (loai.includes("ads") || blob.includes("chi phí ads") || blob.includes("quảng")) return 100;
      return 0;
    case "mail":
      if (loai.includes("mail") || blob.includes("mua mail")) return 100;
      return 0;
    case "cursor":
    case "capcut":
    case "other":
      if (loai.includes("khác") || loai.includes("khac") || loai.includes("other")) return 55;
      return 0;
    default:
      return 0;
  }
};
const sameDay = (txnDate, gmcDate) => {
  const a = normExpenseDate(txnDate);
  const b = normExpenseDate(gmcDate);
  if (!a || !b || a.length < 10 || b.length < 10) return false;
  return a.slice(0, 10) === b.slice(0, 10);
};
const isUsdTxn = (t) => !t.currency || t.currency === "USD" || t.currency === "USDT";
const reconcileCardTxnsAgainstGmc = (txns, gmc) => {
  const countable = txns.filter(isCountableCardTxn);
  const skippedCount = txns.length - countable.length;
  const remaining = gmc.map((e) => ({ e, used: false }));
  const matchedFlags = new Array(countable.length).fill(false);
  const unused = () => remaining.filter((r) => !r.used);
  const unusedByAmount = (amt) => unused().filter((r) => gmcUsdAmount(r.e) === amt);
  const claim = (r, idx) => {
    r.used = true;
    matchedFlags[idx] = true;
  };
  const reservedForOtherMerchant = (gmcRow, current) => {
    const currentKeys = merchantKeywords(current.merchantName);
    if (keywordInGmc(currentKeys, gmcRow)) return false;
    for (let i = 0; i < countable.length; i++) {
      if (matchedFlags[i]) continue;
      const other = countable[i];
      if (other === current) continue;
      const keys = merchantKeywords(other.merchantName);
      if (keys.length && keywordInGmc(keys, gmcRow)) return true;
    }
    return false;
  };
  const scoredCandidates = (t, opts) => {
    const family = merchantFamily(t.merchantName);
    const amt = roundMoney(t.netAmount);
    const pool = unused().filter((r) => {
      const gAmt = gmcUsdAmount(r.e);
      if (opts.allowZeroAmount) return gAmt === amt || gAmt === 0;
      return gAmt === amt;
    });
    return pool.map((r) => ({
      r,
      score: merchantGmcScore(family, t.merchantName, r.e),
      day: sameDay(t.transactionDate, r.e.ngayThanhToan)
    })).filter((x) => x.score >= opts.minScore).filter((x) => !opts.requireSameDay || x.day).filter((x) => !reservedForOtherMerchant(x.r.e, t)).sort((a, b) => Number(b.day) - Number(a.day) || b.score - a.score);
  };
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t)) return;
    const hit = scoredCandidates(t, { minScore: 70, requireSameDay: true })[0];
    if (hit) claim(hit.r, idx);
  });
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t)) return;
    const hit = scoredCandidates(t, { minScore: 70 })[0];
    if (hit) claim(hit.r, idx);
  });
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t)) return;
    const keys = merchantKeywords(t.merchantName);
    if (!keys.length) return;
    const zeroHits = unused().filter((r) => gmcUsdAmount(r.e) === 0 && keywordInGmc(keys, r.e)).map((r) => ({ r, day: sameDay(t.transactionDate, r.e.ngayThanhToan) })).sort((a, b) => Number(b.day) - Number(a.day));
    if (zeroHits.length === 1) claim(zeroHits[0].r, idx);
    else if (zeroHits[0]?.day) claim(zeroHits[0].r, idx);
  });
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !t.cardLast4 || !isUsdTxn(t)) return;
    const amt = roundMoney(t.netAmount);
    const hit = unusedByAmount(amt).find(
      (r) => gmcHasLast4(r.e, t.cardLast4) && !reservedForOtherMerchant(r.e, t)
    );
    if (hit) claim(hit, idx);
  });
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t)) return;
    const hit = scoredCandidates(t, { minScore: 50, requireSameDay: true })[0] ?? scoredCandidates(t, { minScore: 50 })[0];
    if (hit) claim(hit.r, idx);
  });
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t) || !t.transactionDate) return;
    const amt = roundMoney(t.netAmount);
    const sameDayHits = unusedByAmount(amt).filter(
      (r) => sameDay(t.transactionDate, r.e.ngayThanhToan) && !reservedForOtherMerchant(r.e, t)
    );
    if (sameDayHits.length === 1) {
      claim(sameDayHits[0], idx);
      return;
    }
    if (sameDayHits.length > 1) {
      const family = merchantFamily(t.merchantName);
      const ranked = sameDayHits.map((r) => ({ r, score: merchantGmcScore(family, t.merchantName, r.e) })).sort((a, b) => b.score - a.score);
      claim(ranked[0].r, idx);
    }
  });
  const amountKeys = new Set(
    countable.filter((t, idx) => !matchedFlags[idx] && isUsdTxn(t)).map((t) => roundMoney(t.netAmount))
  );
  for (const amt of amountKeys) {
    const txnIdxs = countable.map((t, idx) => ({ t, idx })).filter(({ t, idx }) => !matchedFlags[idx] && isUsdTxn(t) && roundMoney(t.netAmount) === amt).filter(({ t }) => !(merchantFamily(t.merchantName) === "shopify" && amt <= 2));
    if (!txnIdxs.length) continue;
    for (const { t, idx } of txnIdxs) {
      if (matchedFlags[idx]) continue;
      const family = merchantFamily(t.merchantName);
      const freeGmc = unusedByAmount(amt).filter((r) => !reservedForOtherMerchant(r.e, t));
      if (!freeGmc.length) continue;
      freeGmc.sort((a, b) => {
        const dayA = Number(sameDay(t.transactionDate, a.e.ngayThanhToan));
        const dayB = Number(sameDay(t.transactionDate, b.e.ngayThanhToan));
        if (dayA !== dayB) return dayB - dayA;
        return merchantGmcScore(family, t.merchantName, b.e) - merchantGmcScore(family, t.merchantName, a.e);
      });
      claim(freeGmc[0], idx);
    }
  }
  countable.forEach((t, idx) => {
    if (matchedFlags[idx] || !isUsdTxn(t)) return;
    const amt = roundMoney(t.netAmount);
    if (merchantFamily(t.merchantName) === "shopify" && amt <= 2) return;
    const candidates = unusedByAmount(amt).filter((r) => !reservedForOtherMerchant(r.e, t));
    if (candidates.length === 1) claim(candidates[0], idx);
  });
  const matched = [];
  const missing = [];
  countable.forEach((t, idx) => {
    if (!isUsdTxn(t)) {
      missing.push(t);
      return;
    }
    if (matchedFlags[idx]) matched.push(t);
    else missing.push(t);
  });
  const matchedUsd = roundMoney(matched.reduce((s, t) => s + t.netAmount, 0));
  const missingUsd = roundMoney(missing.reduce((s, t) => s + t.netAmount, 0));
  return {
    uploadedCount: countable.length,
    matchedCount: matched.length,
    matched,
    matchedUsd,
    missing,
    missingUsd,
    totalUsd: roundMoney(matchedUsd + missingUsd),
    skippedCount,
    gmcCount: gmc.length
  };
};
const getChiPhiExpenses = async (forceRefresh = false) => {
  if (cachedChiPhiExpenses && !forceRefresh) return cachedChiPhiExpenses;
  try {
    const ts = Date.now();
    const sep = LINK_INVOICES_GMC.includes("?") ? "&" : "?";
    const text = await fetch(`${LINK_INVOICES_GMC}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
    const expenses = parseExpensesFromCsvText(text);
    cachedChiPhiExpenses = expenses;
    return expenses;
  } catch (err) {
    console.error("getChiPhiExpenses error:", err);
    return [];
  }
};
const shopifyRowVal = (row, ...keys) => {
  for (const key of keys) {
    const exact = row[key];
    if (exact != null && String(exact).trim()) return cleanCell(String(exact));
  }
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
  for (const [k, v] of Object.entries(row)) {
    if (keys.some((key) => norm(k) === norm(key)) && v != null && String(v).trim()) {
      return cleanCell(String(v));
    }
  }
  return "";
};
const parseShopifyDateDMY = (raw) => {
  const dmy = (raw ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dmy) return null;
  return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
};
const shopifyDaysLeft = (isoDate) => {
  if (!isoDate) return null;
  const target = /* @__PURE__ */ new Date(`${isoDate}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
};
const getShopifyData = async (forceRefresh = false) => {
  if (cachedShopifyData && !forceRefresh) return cachedShopifyData;
  try {
    const ts = Date.now();
    const sep = LINK_SHOPIFY.includes("?") ? "&" : "?";
    const text = await fetch(`${LINK_SHOPIFY}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
    const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
    const map = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const web = shopifyRowVal(row, "Web Shopify");
      if (!web) continue;
      map.set(web.toLowerCase(), row);
    }
    const records = [...map.values()].map((row) => {
      const ngayDangKy = shopifyRowVal(row, "Ngày Đăng kí", "Ngày đăng kí");
      const ngayHetHan = shopifyRowVal(row, "Ngày hết hạn 1$", "Ngày hết hạn");
      const webHuy = shopifyRowVal(row, "WEB Hủy reg mới");
      const regDate = parseShopifyDateDMY(ngayDangKy);
      const expiryDate = parseShopifyDateDMY(ngayHetHan);
      return {
        nguoiReg: shopifyRowVal(row, "Người Reg"),
        web: shopifyRowVal(row, "Web Shopify"),
        ngayDangKy,
        ngayHetHan,
        webHuy,
        thayWebhooks: shopifyRowVal(row, "Thay webhooks"),
        the: shopifyRowVal(row, "Thẻ"),
        tkTrendsi: shopifyRowVal(row, "TK Trendsi"),
        regDate,
        expiryDate,
        regMonth: regDate ? regDate.slice(0, 7) : null,
        daysLeft: shopifyDaysLeft(expiryDate),
        isCanceled: Boolean(webHuy)
      };
    });
    cachedShopifyData = records;
    return records;
  } catch (err) {
    console.error("getShopifyData error:", err);
    return [];
  }
};
const regKpiRowVal = (row, ...keys) => {
  for (const key of keys) {
    const val = row[key];
    if (val !== void 0 && val !== null && String(val).trim() !== "") {
      return cleanCell(String(val));
    }
  }
  const normalizedKeys = keys.map((k) => k.toLowerCase().replace(/\s+/g, " ").trim());
  for (const [rawKey, val] of Object.entries(row)) {
    const nk = rawKey.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalizedKeys.some((k) => nk === k || nk.includes(k))) {
      const s = cleanCell(String(val ?? ""));
      if (s) return s;
    }
  }
  return "";
};
const parseRegKpiRow = (row, ownerId, ownerName) => {
  const domain = regKpiRowVal(row, "WEB", "Web").toLowerCase().trim();
  if (!domain) return null;
  return {
    ownerId,
    ownerName,
    webType: regKpiRowVal(row, "Loại web"),
    domain,
    dateRegGmc: regKpiRowVal(row, "Ngày Reg GMC", "Ngày về GMC"),
    addCard: regKpiRowVal(row, "Đã Add Thẻ"),
    verifyAds: regKpiRowVal(row, "Verify Ads"),
    verifyAds2: regKpiRowVal(row, "Verify Ads 2"),
    susStatus: regKpiRowVal(row, "Tình Trạng Sus", "Tình trạng Sus") || "—",
    khang1Date: regKpiRowVal(row, "Kháng lần 1"),
    ketQua1: regKpiRowVal(row, "Kết quả 1", "Kết quả"),
    khang2Date: regKpiRowVal(row, "Kháng lần 2"),
    ketQua2: regKpiRowVal(row, "Kết quả 2", "Kết quả lần 2"),
    khang3Date: regKpiRowVal(row, "Kháng lần 3"),
    ketQua3: regKpiRowVal(row, "Kết quả 3", "Kết quả lần 3"),
    note: regKpiRowVal(row, "Note", "Note_1")
  };
};
const getRegKpiData = async (forceRefresh = false) => {
  if (cachedRegKpiData && !forceRefresh) return cachedRegKpiData;
  try {
    const ts = Date.now();
    const all = [];
    await Promise.all(
      REG_KPI_SHEETS.map(async (sheet) => {
        const url = `https://docs.google.com/spreadsheets/d/e/${VE_BO_SHEET_ID}/pub?output=csv&gid=${sheet.gid}&t=${ts}`;
        const text = await fetch(url, { cache: "no-store" }).then((r) => r.text());
        const rows = Papa.parse(text, {
          header: true,
          skipEmptyLines: true
        }).data;
        for (const row of rows) {
          const record = parseRegKpiRow(row, sheet.id, sheet.name);
          if (record) all.push(record);
        }
      })
    );
    cachedRegKpiData = all;
    return all;
  } catch (err) {
    console.error("getRegKpiData error:", err);
    return [];
  }
};
const getRowVal = (row, ...keys) => {
  for (const key of keys) {
    const val = row[key];
    if (val !== void 0 && val !== null && String(val).trim() !== "") {
      return cleanCell(String(val));
    }
  }
  return "";
};
const isDoanhNghiep = (loaiDoc) => {
  const l = loaiDoc.toLowerCase().trim();
  return l.includes("doanh nghi") && !l.includes("chưa xin");
};
const isCaNhan = (loaiDoc) => {
  const l = loaiDoc.toLowerCase().trim();
  return l.includes("cá nhân") || l.includes("ca nhan");
};
const isChuaXinInfo = (loaiDoc) => loaiDoc.toLowerCase().includes("chưa xin");
const isChuaXinDoc = (loaiDoc) => {
  const l = loaiDoc.trim();
  if (!l) return true;
  return isChuaXinInfo(l);
};
const countsInStats = (loaiDoc) => isDoanhNghiep(loaiDoc) || isCaNhan(loaiDoc);
const hasEinDoc = (doc) => doc.trim().length > 0;
const parseKhangStatus = (status) => {
  const s = status.toLowerCase().trim();
  if (!s) return "none";
  if (s.includes("reg lại") || s.includes("reg lai")) return "reg_lai";
  if (s.includes("chưa kháng") || s.includes("chua khang")) return "chua_khang";
  if (s === "fail" || s.includes("fail")) return "fail";
  if (s.includes("kháng về") || s.includes("khang ve")) return "khang_ve";
  return "none";
};
const resolveKhangStatus = (trangThai, khangDot2) => {
  const s2 = parseKhangStatus(khangDot2);
  if (s2 !== "none") return { status: s2, fromDot2: true };
  return { status: parseKhangStatus(trangThai), fromDot2: false };
};
const isBatchSeparator = (tenReg, web = "") => {
  const t = tenReg.toUpperCase().normalize("NFC").trim();
  if (!t.startsWith("INFO")) return false;
  if (t.includes("ĐỢT") || t.includes("DOT") || t.includes("LLC")) return true;
  if (/\bT\d/.test(t)) return true;
  if (/tổng\s*\d+/i.test(web)) return true;
  return false;
};
const parseBatchMeta = (tenReg, web) => {
  const totalMatch = web.match(/(\d+)/);
  const totalDeclared = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const dateMatch = tenReg.match(/ĐỢT\s*(.+)/i) ?? tenReg.match(/DOT\s*(.+)/i);
  const infoTail = tenReg.replace(/^INFO\s+/i, "").trim();
  const label = (dateMatch?.[1] ?? (infoTail || tenReg)).trim();
  const id = label.replace(/\//g, "-").replace(/\s+/g, "_").toLowerCase() || "batch";
  return { name: tenReg, label, totalDeclared, id };
};
const computeInfoBoStats = (records, totalDeclared) => {
  const totalInSheet = records.length;
  const countable = records.filter((r) => r.countsInStats);
  const totalCountable = countable.length;
  const einEligible = records.filter((r) => r.isEinEligible).length;
  const einSubmitted = records.filter((r) => r.isEinEligible && r.hasEin).length;
  const chuaXinInfo = records.filter((r) => isChuaXinInfo(r.loaiDoc)).length;
  const caNhan = records.filter((r) => r.isCaNhan).length;
  const einInfoTotal = einEligible + caNhan;
  const khangVe = records.filter((r) => r.khangStatus === "khang_ve").length;
  const khangFail = records.filter((r) => r.khangStatus === "fail").length;
  const chuaKhang = records.filter((r) => r.khangStatus === "chua_khang").length;
  const regLaiInfo = records.filter((r) => r.khangStatus === "reg_lai").length;
  const khangResolved = khangVe + khangFail;
  const infoInUse = countable.filter((r) => r.isInUse).length;
  const chuaGanWeb = countable.filter((r) => !r.web).length;
  const loaiMap = /* @__PURE__ */ new Map();
  for (const r of records) {
    let key = r.loaiDoc.trim();
    if (!key) key = "Chưa xin doc";
    else if (r.isChuaXinInfo) key = "Chưa xin Info";
    loaiMap.set(key, (loaiMap.get(key) ?? 0) + 1);
  }
  const total = totalDeclared > 0 ? totalDeclared : totalCountable;
  return {
    totalDeclared: total,
    totalInSheet,
    totalCountable,
    einSubmitted,
    einEligible,
    einInfoTotal,
    einRate: einInfoTotal > 0 ? Math.round(einEligible / einInfoTotal * 1e3) / 10 : 0,
    khangVe,
    khangFail,
    chuaKhang,
    regLaiInfo,
    khangVeRate: khangResolved > 0 ? Math.round(khangVe / khangResolved * 1e3) / 10 : 0,
    khangFailRate: khangResolved > 0 ? Math.round(khangFail / khangResolved * 1e3) / 10 : 0,
    infoInUse,
    infoUsableRate: total > 0 ? Math.round(infoInUse / total * 1e3) / 10 : 0,
    chuaXinInfo,
    caNhan,
    chuaGanWeb,
    byLoaiDoc: Array.from(loaiMap.entries()).map(([name, value]) => ({ name, value }))
  };
};
const computeByOwner = (records, batchId, batchLabel) => {
  const map = /* @__PURE__ */ new Map();
  for (const r of records) {
    const name = r.tenReg.trim() || "Chưa gán";
    if (!map.has(name)) {
      map.set(name, {
        name,
        batchId,
        batchLabel,
        totalInfo: 0,
        khangVe: 0,
        khangFail: 0,
        chuaKhang: 0,
        regLaiInfo: 0
      });
    }
    const o = map.get(name);
    o.totalInfo++;
    if (r.isKhangVe) o.khangVe++;
    else if (r.isKhangFail) o.khangFail++;
    else if (r.isChuaKhang) o.chuaKhang++;
    else if (r.isRegLaiInfo) o.regLaiInfo++;
  }
  return Array.from(map.values()).sort((a, b) => b.totalInfo - a.totalInfo);
};
const getInfoBoData = async (forceRefresh = false) => {
  if (forceRefresh) cachedInfoBoData = null;
  if (cachedInfoBoData && !forceRefresh) return cachedInfoBoData;
  const empty = {
    batches: [],
    batchName: "",
    records: [],
    stats: computeInfoBoStats([], 0),
    byOwner: []
  };
  try {
    const ts = (/* @__PURE__ */ new Date()).getTime();
    const sep = LINK_INFO_BO.includes("?") ? "&" : "?";
    const text = await fetch(`${LINK_INFO_BO}${sep}t=${ts}`, { cache: "no-store" }).then((r) => r.text());
    const rows = Papa.parse(text, {
      header: true,
      skipEmptyLines: true
    }).data;
    const records = [];
    const batchRecords = /* @__PURE__ */ new Map();
    const batchMeta = /* @__PURE__ */ new Map();
    let currentBatchId = "";
    let batchIndex = 0;
    for (const row of rows) {
      const tenReg = getRowVal(row, "Tên ", "Tên");
      const web = getRowVal(row, "Web");
      const infoCaNhan = getRowVal(row, "Info cá nhân");
      if (isBatchSeparator(tenReg, web)) {
        const meta = parseBatchMeta(tenReg, web);
        currentBatchId = meta.id || `batch-${++batchIndex}`;
        batchMeta.set(currentBatchId, { ...meta, id: currentBatchId });
        if (!batchRecords.has(currentBatchId)) batchRecords.set(currentBatchId, []);
        continue;
      }
      if (!infoCaNhan && !web && !tenReg) continue;
      if (!currentBatchId) {
        currentBatchId = "unassigned";
        batchMeta.set(currentBatchId, {
          id: currentBatchId,
          name: "Chưa phân đợt",
          label: "Chưa phân đợt",
          totalDeclared: 0
        });
        batchRecords.set(currentBatchId, []);
      }
      const loaiDoc = getRowVal(row, "Loại Doc");
      const docDoanhNghiep = getRowVal(row, "Doc doanh nghiệp");
      const trangThai = getRowVal(row, "Trạng thái");
      const khangDot2 = getRowVal(row, "Kháng đợt 2", "Khang dot 2", "Kháng đợt2") || (() => {
        for (const [k, v] of Object.entries(row)) {
          const lk = k.toLowerCase().replace(/\s+/g, " ");
          if (lk.includes("kháng đợt") || lk.includes("khang dot") || lk.includes("đợt 2")) {
            const s = String(v ?? "").trim();
            if (s) return cleanCell(s);
          }
        }
        return "";
      })();
      const sttRaw = getRowVal(row, "");
      const stt = parseInt(sttRaw, 10) || (batchRecords.get(currentBatchId)?.length ?? 0) + 1;
      const einEligible = isDoanhNghiep(loaiDoc);
      const caNhan = isCaNhan(loaiDoc);
      const inStats = countsInStats(loaiDoc);
      const resolved = resolveKhangStatus(trangThai, khangDot2);
      const khangStatus = resolved.status;
      const record = {
        stt,
        batchId: currentBatchId,
        tenReg,
        web,
        hanDomain: getRowVal(row, "Hạn Domain"),
        infoCaNhan,
        dev: getRowVal(row, "DEV"),
        loaiDoc,
        docCaNhan: getRowVal(row, "Doc cá nhân"),
        docDoanhNghiep,
        trangThai,
        khangDot2,
        note: getRowVal(row, "Note"),
        isEinEligible: einEligible,
        isCaNhan: caNhan,
        countsInStats: inStats,
        hasEin: einEligible && hasEinDoc(docDoanhNghiep),
        khangStatus,
        isKhangDot2: resolved.fromDot2,
        isKhangVe: khangStatus === "khang_ve",
        isKhangFail: khangStatus === "fail",
        isChuaKhang: khangStatus === "chua_khang",
        isRegLaiInfo: khangStatus === "reg_lai",
        isChuaXinInfo: isChuaXinDoc(loaiDoc),
        isInUse: inStats && Boolean(web)
      };
      records.push(record);
      batchRecords.get(currentBatchId).push(record);
    }
    const batches = Array.from(batchMeta.entries()).map(([id, meta]) => {
      const batchRows = batchRecords.get(id) ?? [];
      return {
        id,
        name: meta.name,
        label: meta.label,
        totalDeclared: meta.totalDeclared,
        stats: computeInfoBoStats(batchRows, meta.totalDeclared),
        byOwner: computeByOwner(batchRows, id, meta.label)
      };
    });
    const batchesWithRows = batches.filter((b) => b.stats.totalInSheet > 0);
    const totalDeclaredAll = batchesWithRows.length > 0 ? batchesWithRows.reduce((sum, b) => sum + b.totalDeclared, 0) : batches.reduce((sum, b) => sum + b.totalDeclared, 0);
    const result = {
      batches,
      batchName: batches.map((b) => b.label).join(" · "),
      records,
      stats: computeInfoBoStats(records, totalDeclaredAll),
      byOwner: batches.flatMap((b) => b.byOwner)
    };
    cachedInfoBoData = result;
    return result;
  } catch (err) {
    console.error("getInfoBoData error:", err);
    return empty;
  }
};
export {
  REG_KPI_SHEETS as R,
  WEB_SHIELD_SHEETS as W,
  getAllDataWeb as a,
  getWebStatusBucket as b,
  getTongHopWebRegs as c,
  reconcileExpensesAgainstGmc as d,
  isCardTxnHeaders as e,
  parseCardTxnRows as f,
  getWebShieldData as g,
  isAirwallexHeaders as h,
  isWebKpiRecord as i,
  parseExpenseRows as j,
  isCardTxnCsv as k,
  parseCardTxnCsvText as l,
  parseExpensesFromCsvText as m,
  isGoogleAdsMerchant as n,
  getChiPhiExpenses as o,
  parseExcelRows as p,
  parseGmcSusKind as q,
  reconcileCardTxnsAgainstGmc as r,
  getGMCRegData as s,
  getShopifyData as t,
  getRegKpiData as u,
  isValidGmcWebDomain as v,
  getLatestWebData as w,
  parseKhangStatus as x,
  getInfoBoData as y,
  clearInfoBoCache as z
};
