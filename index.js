/**
 * Gitlab Webhooks handler
*/

var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var crypto = require('crypto')
var bl = require('bl')

function isObject(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]'
}

function findHandler(url, arr) {
  var ret = arr[0]
  for (var i = 0; i < arr.length; i++) {
    if (url.split('?').shift() === arr[i].path)
      ret = arr[i]
  }
  return ret
}

function create(options) {
  // make it an EventEmitter, sort of
  handler.__proto__ = EventEmitter.prototype
  EventEmitter.call(handler)

  return handler

  function handler(req, res, callback) {
    function hasError(msg) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: msg }))

      var err = new Error(msg)
      handler.emit('error', err, req)
      callback(err)
    }

    function checkType(options) {
      if (!isObject(options))
          throw new TypeError('must provide an options object')

      if (typeof options.path !== 'string')
        throw new TypeError('must provide a \'path\' option')
      
      if (typeof options.secret !== 'string')
        throw new TypeError('must provide a \'secret\' option')
    }

    var currentOptions
    if (Array.isArray(options)) {
      currentOptions = findHandler(req.url, options)
    } else {
      currentOptions = options
    }

    checkType(currentOptions)

    if (req.url.split('?').shift() !== currentOptions.path || req.method !== 'POST')
      return callback()

    var token = req.headers['x-gitlab-token']
    if(!token || token !== currentOptions.secret)
      return hasError('No X-Gitlab-Token found on request or the token did not match')
    
    var event = req.headers['x-gitlab-event']
    var events = currentOptions.events

    if (!event)
      return hasError('No X-Gitlab-Event found on request')
    
    if (events && events.indexOf(event) === -1)
      return hasError('X-Gitlab-Event is not acceptable')
    
    req.pipe(bl(function(err, data) {
      if (err)
        return hasError(err.message)

      var obj

      try {
        obj = JSON.parse(data.toString())
      } catch (e) {
        return hasError(e)
      }

      var event = obj.object_kind

     res.writeHead(200, { 'content-type': 'application/json' })
     res.end('{"ok":true}')

      var emitData = {
        event: event,
        payload: obj,
        protocol: req.protocol,
        host: req.headers['host'],
        url: req.url,
        path: currentOptions.path
      }

      handler.emit(event, emitData)
      handler.emit('*', emitData)
    }))
  }
}

module.exports = create
