// deferred-promise-light.js

'use strict';

(function () {

var STATE_UNRESOLVED = 0;
var STATE_RESOLVED = 1;
var STATE_REJECTED = 2;

/**
 * class Deferred.
 *
 * constructor()
 */
function Deferred() {
  if (!(this instanceof Deferred))
    return new Deferred();

  /**
   * state. 状態 (UNRESOLVED, RESOLVED, REJECTED)
   */
  this.state = STATE_UNRESOLVED;

  /**
   * value. 最終値
   */
  this.value = undefined;

  /**
   * array of callbacks. コールバック配列
   */
  this.callbacks = [];
}

/**
 * isResolved. 解決済み
 */
Deferred.prototype.isResolved = function isResolved() { return this.state === STATE_RESOLVED; };

/**
 * isRejected. 拒否済み
 */
Deferred.prototype.isRejected = function isRejected() { return this.state === STATE_REJECTED; };

/**
 * then.
 */
Deferred.prototype.then = function then(callback, errback) {
  var dfd = new Deferred();
  this.callbacks.push({cb:callback, eb:errback, dfd:dfd});
  if (this.state == STATE_RESOLVED) {
    if (callback) callback(this.value);
    dfd.resolve(this.value);
  }
  else if (this.state == STATE_REJECTED) {
    if (errback) errback(this.value);
    dfd.reject(this.value);
  }
  return dfd.promise();
};

/**
 * resolve. 解決
 */
Deferred.prototype.resolve = function resolve(res) {
  if (this.state !== STATE_UNRESOLVED) return this;
  this.state = STATE_RESOLVED;
  this.value = res;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.cb === 'function') {
      var p = val.cb(res);
      var pp = (p === undefined) ? res: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); });
      else val.dfd.resolve(pp);
    }
    else val.dfd.resolve(res);
  });
  return this;
};

/**
 * reject. 拒否
 */
Deferred.prototype.reject = function reject(err) {
  if (this.state !== STATE_UNRESOLVED) return this;
  this.state = STATE_REJECTED;
  this.value = err;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.eb === 'function') {
      var p = val.eb(err);
      var pp = (p === undefined) ? err: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); });
      else val.dfd.reject(pp);
    }
    else val.dfd.reject(err);
  });
  return this;
};

/**
 * promise. 約束
 */
Deferred.prototype.promise = function promise() {
  //return new Promise(this);

  //var dfd = this;
  //return {
  //  then: function () { return dfd.then.apply(dfd, arguments); },
  //  done: function () { return dfd.then.apply(dfd, arguments); },
  //  fail: function fail(errback) { return this.then(undefined, errback); },
  //};

  var pr = function (cb) {
    return pr.then(
      function (res) {
        pr.deferred.resolve(res);
        if (typeof cb === 'function') cb(null, res);
      },
      function (err) {
        pr.deferred.reject(err);
        if (typeof cb === 'function') cb(err);
      });
  };
  pr.deferred = this;
  pr.__proto__ = Promise.prototype;
  return pr;
};

/**
 * fail.
 */
Deferred.prototype.fail = function fail(errback) { return this.then(undefined, errback); };
/**
 * done.
 */
Deferred.prototype.done = function then(callback, errback) {
    return this.then(callback, errback);
};

/**
 * class Promise.
 *
 * constructor(deferred)
 */
function Promise(deferred) {
  if (!(this instanceof Promise))
    return new Promise(deferred);

  if (typeof deferred !== 'object' || !(deferred instanceof Deferred))
    throw new Error('Deferred object needed');

  this.deferred = deferred;
}

/**
 * isResolved. 解決済み
 */
Promise.prototype.isResolved = function isResolved() { return this.deferred.isResolved(); };

/**
 * isRejected. 拒否済み
 */
Promise.prototype.isRejected = function isRejected() { return this.deferred.isRejected(); };

/**
 * then.
 */
Promise.prototype.then = function then(callback, errback) {
  return this.deferred.then(callback, errback);
};

/**
 * fail.
 */
Promise.prototype.fail = function fail(errback) { return this.then(undefined, errback); };

/**
 * done.
 */
Promise.prototype.done = function then(callback, errback) {
    return this.then(callback, errback);
};

//require('util').inherits(Promise, Function);

/**
 * isPromise.
 */
function isPromise(fn) {
  return fn && (typeof fn === 'object' || typeof fn === 'function') && typeof fn.then === 'function';
}
Promise.isPromise = isPromise;

/**
 * sleep.
 */
function sleep(ms) {
  var dfd = new Deferred();
  setTimeout(function () { dfd.resolve(); }, ms);
  return dfd.promise();
}
function ok(res) {
  var dfd = new Deferred();
  dfd.resolve(res);
  return dfd.promise();
}
function ng(err) {
  var dfd = new Deferred();
  dfd.reject(err);
  return dfd.promise();
}

exports.Deferred  = Deferred;
exports.Promise   = Promise;
exports.isPromise = isPromise;
exports.sleep     = sleep;
exports.ok        = ok;
exports.ng        = ng;

})();

// http://d.hatena.ne.jp/cheesepie/20111112/1321064204
// http://wiki.commonjs.org/wiki/Promises/A
// http://tokkono.cute.coocan.jp/blog/slow/index.php/programming/jquery-deferred-for-responsive-applications-basic/

