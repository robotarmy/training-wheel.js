/*
 * Wheel.js - version 0.3.0
 * http://github.com/baccigalupi/wheel.js
 * Copyright (c) 2012 Kane Baccigalupi
 * Licensed MIT: http://github.com/baccigalupi/wheel.js/LICENSE.txt
 *
 * Included Libraries:
 * ================================================================
 * Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-draganddrop-touch-cssclasses-teststyles-hasevent-prefixes-load
 *
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 *
 * Zepto v1.0rc1 - polyfill zepto event detect fx ajax form touch - zeptojs.com/license
 *
 * jQuery JavaScript Library v1.7.2
 *  http://jquery.com/ Copyright 2011, John Resig. Dual licensed under the MIT or GPL Version 2 licenses. http://jquery.org/license
 *  Includes Sizzle.js http://sizzlejs.com/ Copyright 2011, The Dojo Foundation. Released under the MIT, BSD, and GPL Licenses.
 *
 * Backbone.js 0.9.2 (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.MIT license.
 *
 * todo: add ember, jquery cookies plugin, remy's localStorage fill??
 *
 */
/* Zepto v1.0rc1 - polyfill zepto event detect fx ajax form touch - zeptojs.com/license */
;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()
var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,

    // Used by `$.zepto.init` to wrap elements, text/comment nodes, document,
    // and document fragment node types.
    elementTypes = [1, 3, 8, 9, 11],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]+)$/,
    tagSelectorRE = /^[\w-]+$/,
    toString = ({}).toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function isFunction(value) { return toString.call(value) == "[object Function]" }
  function isObject(value) { return value instanceof Object }
  function isPlainObject(value) {
    var key, ctor
    if (toString.call(value) !== "[object Object]") return false
    ctor = (isFunction(value.constructor) && value.constructor.prototype)
    if (!ctor || !hasOwnProperty.call(ctor, 'isPrototypeOf')) return false
    for (key in value);
    return key === undefined || hasOwnProperty.call(value, key)
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return array.filter(function(item){ return item !== undefined && item !== null }) }
  function flatten(array) { return array.length > 0 ? [].concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return array.filter(function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name) {
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'
    var container = containers[name]
    container.innerHTML = '' + html
    return $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = arguments.callee.prototype
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // if a JavaScript object is given, return a copy of it
      // this is a somewhat peculiar option, but supported by
      // jQuery so we'll do it, too
      else if (isPlainObject(selector))
        dom = [$.extend({}, selector)], selector = null
      // wrap stuff like `document` or `window`
      else if (elementTypes.indexOf(selector.nodeType) >= 0 || selector === window)
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, whichs makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
        if (source[key] !== undefined)
          target[key] = source[key]
    })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (element === document && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : emptyArray ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? emptyArray :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  function funcArg(context, arg, idx, payload) {
   return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  $.isFunction = isFunction
  $.isObject = isObject
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $.map(this, function(el, i){ return fn.call(el, i, el) })
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      this.forEach(function(el, idx){ callback.call(el, idx, el) })
      return this
    },
    filter: function(selector){
      return $([].filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result
      if (this.length == 1) result = zepto.qsa(this[0], selector)
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return $(result)
    },
    closest: function(selector, context){
      var node = this[0]
      while (node && !zepto.matches(node, selector))
        node = node !== context && node !== document && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return slice.call(this.children) }), selector)
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return slice.call(el.parentNode.children).filter(function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return this.map(function(){ return this[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(newContent){
      return this.each(function(){
        $(this).wrapAll($(newContent)[0].cloneNode(false))
      })
    },
    wrapAll: function(newContent){
      if (this[0]) {
        $(this[0]).before(newContent = $(newContent))
        newContent.append(this)
      }
      return this
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return $(this.map(function(){ return this.cloneNode(true) }))
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return (setting === undefined ? this.css("display") == "none" : setting) ? this.show() : this.hide()
    },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) this.setAttribute(key, name[key])
          else this.setAttribute(name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ if (this.nodeType === 1) this.removeAttribute(name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] ? this[0][name] : undefined) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? data : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this.length > 0 ? this[0].value : undefined) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(){
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: obj.width,
        height: obj.height
      }
    },
    css: function(property, value){
      if (value === undefined && typeof property == 'string')
        return (
          this.length == 0
            ? undefined
            : this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      for (key in property)
        if(typeof property[key] == 'string' && property[key] == '')
          this.each(function(){ this.style.removeProperty(dasherize(key)) })
        else
          css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'

      if (typeof property == 'string')
        if (value == '')
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (this.length < 1) return false
      else return classRE(name).test(this[0].className)
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = this.className, newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && (this.className += (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined)
          return this.className = ''
        classList = this.className
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        this.className = classList.trim()
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var newName = funcArg(this, name, idx, this.className)
        ;(when === undefined ? !$(this).hasClass(newName) : when) ?
          $(this).addClass(newName) : $(this).removeClass(newName)
      })
    }
  }

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return this[0] == window ? window['inner' + Dimension] :
        this[0] == document ? document.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        var el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function insert(operator, target, node) {
    var parent = (operator % 2) ? target : target.parentNode
    parent ? parent.insertBefore(node,
      !operator ? target.nextSibling :      // after
      operator == 1 ? parent.firstChild :   // prepend
      operator == 2 ? target :              // before
      null) :                               // append
      $(node).remove()
  }

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(key, operator) {
    $.fn[key] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var nodes = $.map(arguments, function(n){ return isObject(n) ? n : zepto.fragment(n) })
      if (nodes.length < 1) return this
      var size = this.length, copyByClone = size > 1, inReverse = operator < 2

      return this.each(function(index, target){
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[inReverse ? nodes.length-i-1 : i]
          traverseNode(node, function(node){
            if (node.nodeName != null && node.nodeName.toUpperCase() === 'SCRIPT' && (!node.type || node.type === 'text/javascript'))
              window['eval'].call(window, node.innerHTML)
          })
          if (copyByClone && index < size - 1) node = node.cloneNode(true)
          insert(operator, target, node)
        }
      })
    }

    $.fn[(operator % 2) ? key+'To' : 'insert'+(operator ? 'Before' : 'After')] = function(html){
      $(html)[key](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.camelize = camelize
  zepto.uniq = uniq
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
'$' in window || (window.$ = Zepto)
;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={}

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.isObject(events)) $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function add(element, events, fn, selector, getDelegate, capture){
    capture = !!capture
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var delegate = getDelegate && getDelegate(fn, event),
        callback = delegate || fn
      var proxyfn = function (event) {
        var result = callback.apply(element, [event].concat(event.data))
        if (result === false) event.preventDefault()
        return result
      }
      var handler = $.extend(parse(event), {fn: fn, proxy: proxyfn, sel: selector, del: delegate, i: set.length})
      set.push(handler)
      element.addEventListener(handler.e, proxyfn, capture)
    })
  }
  function remove(element, events, fn, selector){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(handler.e, handler.proxy, false)
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var proxy = $.extend({originalEvent: event}, event)
    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    var capture = false
    if(event == 'blur' || event == 'focus'){
      if($.iswebkit)
        event = event == 'blur' ? 'focusout' : event == 'focus' ? 'focusin' : event
      else
        capture = true
    }

    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      }, capture)
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.bind(event, selector) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.unbind(event, selector) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string') event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback){ return this.bind(event, callback) }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else if (this.length) try { this.get(0)[name]() } catch(e){}
      return this
    }
  })

  $.Event = function(type, props) {
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    return event
  }

})(Zepto)
;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/)

    // todo clean this up with a better OS/browser
    // separation. we need to discern between multiple
    // browsers on android, and decide if kindle fire in
    // silk mode is android or not

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)
;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    clearProperties = {}

  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  clearProperties[prefix + 'transition-property'] =
  clearProperties[prefix + 'transition-duration'] =
  clearProperties[prefix + 'transition-timing-function'] =
  clearProperties[prefix + 'animation-name'] =
  clearProperties[prefix + 'animation-duration'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = duration / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var transforms, cssProperties = {}, key, that = this, wrappedCallback, endEvent = $.fx.transitionEnd
    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssProperties[prefix + 'animation-name'] = properties
      cssProperties[prefix + 'animation-duration'] = duration + 's'
      endEvent = $.fx.animationEnd
    } else {
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) {
          transforms || (transforms = [])
          transforms.push(key + '(' + properties[key] + ')')
        }
        else cssProperties[key] = properties[key]

      if (transforms) cssProperties[prefix + 'transform'] = transforms.join(' ')
      if (!$.fx.off && typeof properties === 'object') {
        cssProperties[prefix + 'transition-property'] = Object.keys(properties).join(', ')
        cssProperties[prefix + 'transition-duration'] = duration + 's'
        cssProperties[prefix + 'transition-timing-function'] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, arguments.callee)
      }
      $(this).css(clearProperties)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    setTimeout(function() {
      that.css(cssProperties)
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) })
      }, 0)
    }, 0)

    return this
  }

  testEl = null
})(Zepto)
;(function($){
  var jsonpID = 0,
      isObject = $.isObject,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      abort = function(){
        $(script).remove()
        if (callbackName in window) window[callbackName] = empty
        ajaxComplete('abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (options.error) script.onerror = function() {
      xhr.abort()
      options.error()
    }

    window[callbackName] = function(data){
      clearTimeout(abortTimeout)
      $(script).remove()
      delete window[callbackName]
      ajaxSuccess(data, xhr, options)
    }

    serializeData(options)
    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.abort()
        ajaxComplete('timeout', xhr, options)
      }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0
  }

  function mimeToDataType(mime) {
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (isObject(options.data)) options.data = $.param(options.data)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = $.ajaxSettings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, 'error', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  $.get = function(url, success){ return $.ajax({ url: url, success: success }) }

  $.post = function(url, data, success, dataType){
    if ($.isFunction(data)) dataType = dataType || success, success = data, data = null
    return $.ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
  }

  $.getJSON = function(url, success){
    return $.ajax({ url: url, success: success, dataType: 'json' })
  }

  $.fn.load = function(url, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector
    if (parts.length > 1) url = parts[0], selector = parts[1]
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response.replace(rscript, "")).find(selector).html()
        : response)
      success && success.call(self)
    })
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var array = $.isArray(obj)
    $.each(obj, function(key, value) {
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (traditional ? $.isArray(value) : isObject(value))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace('%20', '+')
  }
})(Zepto)
;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)
//;(function($){
  //var touch = {}, touchTimeout

  //function parentIfText(node){
    //return 'tagName' in node ? node : node.parentNode
  //}

  //function swipeDirection(x1, x2, y1, y2){
    //var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
    //return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  //}

  //var longTapDelay = 750, longTapTimeout

  //function longTap(){
    //longTapTimeout = null
    //if (touch.last) {
      //touch.el.trigger('longTap')
      //touch = {}
    //}
  //}

  //function cancelLongTap(){
    //if (longTapTimeout) clearTimeout(longTapTimeout)
    //longTapTimeout = null
  //}

  //$(document).ready(function(){
    //var now, delta

    //$(document.body).bind('touchstart', function(e){
      //now = Date.now()
      //delta = now - (touch.last || now)
      //touch.el = $(parentIfText(e.touches[0].target))
      //touchTimeout && clearTimeout(touchTimeout)
      //touch.x1 = e.touches[0].pageX
      //touch.y1 = e.touches[0].pageY
      //if (delta > 0 && delta <= 250) touch.isDoubleTap = true
      //touch.last = now
      //longTapTimeout = setTimeout(longTap, longTapDelay)
    //}).bind('touchmove', function(e){
      //cancelLongTap()
      //touch.x2 = e.touches[0].pageX
      //touch.y2 = e.touches[0].pageY
    //}).bind('touchend', function(e){
       //cancelLongTap()

      //// double tap (tapped twice within 250ms)
      //if (touch.isDoubleTap) {
        //touch.el.trigger('doubleTap')
        //touch = {}

      //// swipe
      //} else if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                 //(touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {
        //touch.el.trigger('swipe') &&
          //touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
        //touch = {}

      //// normal tap
      //} else if ('last' in touch) {
        //touch.el.trigger('tap')

        //touchTimeout = setTimeout(function(){
          //touchTimeout = null
          //touch.el.trigger('singleTap')
          //touch = {}
        //}, 250)
      //}
    //}).bind('touchcancel', function(){
      //if (touchTimeout) clearTimeout(touchTimeout)
      //if (longTapTimeout) clearTimeout(longTapTimeout)
      //longTapTimeout = touchTimeout = null
      //touch = {}
    //})
  //})

  //;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    //$.fn[m] = function(callback){ return this.bind(m, callback) }
  //})
//})(Zepto)
/* Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-draganddrop-touch-cssclasses-teststyles-hasevent-prefixes-load
 */
;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.5.3',

    Modernizr = {},

    enableClasses = true,

    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,

    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node,
          div = document.createElement('div'),
                body = document.body, 
                fakeBody = body ? body : document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style>', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if(!body){
                fakeBody.style.background = "";
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        !body ? fakeBody.parentNode.removeChild(fakeBody) : div.parentNode.removeChild(div);

      return !!ret;

    },



    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

            var isSupported = eventName in element;

        if ( !isSupported ) {
                if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

                    if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),


    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProperty;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProperty = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProperty = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F;

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }


    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }


    var testBundle = (function( styles, tests ) {
        var style = styles.join(''),
            len = tests.length;

        injectElementWithStyles(style, function( node, rule ) {
            var style = document.styleSheets[document.styleSheets.length - 1],
                                                    cssText = style ? (style.cssRules && style.cssRules[0] ? style.cssRules[0].cssText : style.cssText || '') : '',
                children = node.childNodes, hash = {};

            while ( len-- ) {
                hash[children[len].id] = children[len];
            }

                       Modernizr['touch'] = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch || (hash['touch'] && hash['touch'].offsetTop) === 9; 
                                }, len, tests);

    })([
                       ,['@media (',prefixes.join('touch-enabled),('),mod,')',
                                '{#touch{top:9px;position:absolute}}'].join('')           ],
      [
                       ,'touch'                ]);



    tests['touch'] = function() {
        return Modernizr['touch'];
    };



    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };
    for ( var feature in tests ) {
        if ( hasOwnProperty(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }
    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;


    Modernizr.hasEvent      = isEventSupported;    Modernizr.testStyles    = injectElementWithStyles;    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                                                    (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
/*yepnope1.5.3|WTFPL*/
(function(a,b,c){function d(a){return o.call(a)=="[object Function]"}function e(a){return typeof a=="string"}function f(){}function g(a){return!a||a=="loaded"||a=="complete"||a=="uninitialized"}function h(){var a=p.shift();q=1,a?a.t?m(function(){(a.t=="c"?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){a!="img"&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l={},o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};y[c]===1&&(r=1,y[c]=[],l=b.createElement(a)),a=="object"?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),a!="img"&&(r||y[c]===2?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i(b=="c"?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),p.length==1&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&o.call(a.opera)=="[object Opera]",l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return o.call(a)=="[object Array]"},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,i){var j=b(a),l=j.autoCallback;j.url.split(".").pop().split("?").shift(),j.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]||h),j.instead?j.instead(a,e,f,g,i):(y[j.url]?j.noexec=!0:y[j.url]=1,f.load(j.url,j.forceCSS||!j.forceJS&&"css"==j.url.split(".").pop().split("?").shift()?"c":c,j.noexec,j.attrs,j.timeout),(d(e)||d(l))&&f.load(function(){k(),e&&e(j.origUrl,i,g),l&&l(j.origUrl,i,g),y[j.url]=2})))}function i(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var j,l,m=this.yepnope.loader;if(e(a))g(a,0,m,0);else if(w(a))for(j=0;j<a.length;j++)l=a[j],e(l)?g(l,0,m,0):w(l)?B(l):Object(l)===l&&i(l,m);else Object(a)===a&&i(a,m)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,b.readyState==null&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}})(this,document);
Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};
;/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var Mustache = (typeof module !== "undefined" && module.exports) || {};

(function (exports) {

  exports.name = "mustache.js";
  exports.version = "0.5.0-dev";
  exports.tags = ["{{", "}}"];
  exports.parse = parse;
  exports.compile = compile;
  exports.render = render;
  exports.clearCache = clearCache;

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  var _toString = Object.prototype.toString;
  var _isArray = Array.isArray;
  var _forEach = Array.prototype.forEach;
  var _trim = String.prototype.trim;

  var isArray;
  if (_isArray) {
    isArray = _isArray;
  } else {
    isArray = function (obj) {
      return _toString.call(obj) === "[object Array]";
    };
  }

  var forEach;
  if (_forEach) {
    forEach = function (obj, callback, scope) {
      return _forEach.call(obj, callback, scope);
    };
  } else {
    forEach = function (obj, callback, scope) {
      for (var i = 0, len = obj.length; i < len; ++i) {
        callback.call(scope, obj[i], i, obj);
      }
    };
  }

  var spaceRe = /^\s*$/;

  function isWhitespace(string) {
    return spaceRe.test(string);
  }

  var trim;
  if (_trim) {
    trim = function (string) {
      return string == null ? "" : _trim.call(string);
    };
  } else {
    var trimLeft, trimRight;

    if (isWhitespace("\xA0")) {
      trimLeft = /^\s+/;
      trimRight = /\s+$/;
    } else {
      // IE doesn't match non-breaking spaces with \s, thanks jQuery.
      trimLeft = /^[\s\xA0]+/;
      trimRight = /[\s\xA0]+$/;
    }

    trim = function (string) {
      return string == null ? "" :
        String(string).replace(trimLeft, "").replace(trimRight, "");
    };
  }

  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML(string) {
    return String(string).replace(/&(?!\w+;)|[<>"']/g, function (s) {
      return escapeMap[s] || s;
    });
  }

  /**
   * Adds the `template`, `line`, and `file` properties to the given error
   * object and alters the message to provide more useful debugging information.
   */
  function debug(e, template, line, file) {
    file = file || "<template>";

    var lines = template.split("\n"),
        start = Math.max(line - 3, 0),
        end = Math.min(lines.length, line + 3),
        context = lines.slice(start, end);

    var c;
    for (var i = 0, len = context.length; i < len; ++i) {
      c = i + start + 1;
      context[i] = (c === line ? " >> " : "    ") + context[i];
    }

    e.template = template;
    e.line = line;
    e.file = file;
    e.message = [file + ":" + line, context.join("\n"), "", e.message].join("\n");

    return e;
  }

  /**
   * Looks up the value of the given `name` in the given context `stack`.
   */
  function lookup(name, stack, defaultValue) {
    if (name === ".") {
      return stack[stack.length - 1];
    }

    var names = name.split(".");
    var lastIndex = names.length - 1;
    var target = names[lastIndex];

    var value, context, i = stack.length, j, localStack;
    while (i) {
      localStack = stack.slice(0);
      context = stack[--i];

      j = 0;
      while (j < lastIndex) {
        context = context[names[j++]];

        if (context == null) {
          break;
        }

        localStack.push(context);
      }

      if (context && typeof context === "object" && target in context) {
        value = context[target];
        break;
      }
    }

    // If the value is a function, call it in the current context.
    if (typeof value === "function") {
      value = value.call(localStack[localStack.length - 1]);
    }

    if (value == null)  {
      return defaultValue;
    }

    return value;
  }

  function renderSection(name, stack, callback, inverted) {
    var buffer = "";
    var value =  lookup(name, stack);

    if (inverted) {
      // From the spec: inverted sections may render text once based on the
      // inverse value of the key. That is, they will be rendered if the key
      // doesn't exist, is false, or is an empty list.
      if (value == null || value === false || (isArray(value) && value.length === 0)) {
        buffer += callback();
      }
    } else if (isArray(value)) {
      forEach(value, function (value) {
        stack.push(value);
        buffer += callback();
        stack.pop();
      });
    } else if (typeof value === "object") {
      stack.push(value);
      buffer += callback();
      stack.pop();
    } else if (typeof value === "function") {
      var scope = stack[stack.length - 1];
      var scopedRender = function (template) {
        return render(template, scope);
      };
      buffer += value.call(scope, callback(), scopedRender) || "";
    } else if (value) {
      buffer += callback();
    }

    return buffer;
  }

  /**
   * Parses the given `template` and returns the source of a function that,
   * with the proper arguments, will render the template. Recognized options
   * include the following:
   *
   *   - file     The name of the file the template comes from (displayed in
   *              error messages)
   *   - tags     An array of open and close tags the `template` uses. Defaults
   *              to the value of Mustache.tags
   *   - debug    Set `true` to log the body of the generated function to the
   *              console
   *   - space    Set `true` to preserve whitespace from lines that otherwise
   *              contain only a {{tag}}. Defaults to `false`
   */
  function parse(template, options) {
    options = options || {};

    var tags = options.tags || exports.tags,
        openTag = tags[0],
        closeTag = tags[tags.length - 1];

    var code = [
      'var buffer = "";', // output buffer
      "\nvar line = 1;", // keep track of source line number
      "\ntry {",
      '\nbuffer += "'
    ];

    var spaces = [],      // indices of whitespace in code on the current line
        hasTag = false,   // is there a {{tag}} on the current line?
        nonSpace = false; // is there a non-space char on the current line?

    // Strips all space characters from the code array for the current line
    // if there was a {{tag}} on it and otherwise only spaces.
    var stripSpace = function () {
      if (hasTag && !nonSpace && !options.space) {
        while (spaces.length) {
          code.splice(spaces.pop(), 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    };

    var sectionStack = [], updateLine, nextOpenTag, nextCloseTag;

    var setTags = function (source) {
      tags = trim(source).split(/\s+/);
      nextOpenTag = tags[0];
      nextCloseTag = tags[tags.length - 1];
    };

    var includePartial = function (source) {
      code.push(
        '";',
        updateLine,
        '\nvar partial = partials["' + trim(source) + '"];',
        '\nif (partial) {',
        '\n  buffer += render(partial,stack[stack.length - 1],partials);',
        '\n}',
        '\nbuffer += "'
      );
    };

    var openSection = function (source, inverted) {
      var name = trim(source);

      if (name === "") {
        throw debug(new Error("Section name may not be empty"), template, line, options.file);
      }

      sectionStack.push({name: name, inverted: inverted});

      code.push(
        '";',
        updateLine,
        '\nvar name = "' + name + '";',
        '\nvar callback = (function () {',
        '\n  return function () {',
        '\n    var buffer = "";',
        '\nbuffer += "'
      );
    };

    var openInvertedSection = function (source) {
      openSection(source, true);
    };

    var closeSection = function (source) {
      var name = trim(source);
      var openName = sectionStack.length != 0 && sectionStack[sectionStack.length - 1].name;

      if (!openName || name != openName) {
        throw debug(new Error('Section named "' + name + '" was never opened'), template, line, options.file);
      }

      var section = sectionStack.pop();

      code.push(
        '";',
        '\n    return buffer;',
        '\n  };',
        '\n})();'
      );

      if (section.inverted) {
        code.push("\nbuffer += renderSection(name,stack,callback,true);");
      } else {
        code.push("\nbuffer += renderSection(name,stack,callback);");
      }

      code.push('\nbuffer += "');
    };

    var sendPlain = function (source) {
      code.push(
        '";',
        updateLine,
        '\nbuffer += lookup("' + trim(source) + '",stack,"");',
        '\nbuffer += "'
      );
    };

    var sendEscaped = function (source) {
      code.push(
        '";',
        updateLine,
        '\nbuffer += escapeHTML(lookup("' + trim(source) + '",stack,""));',
        '\nbuffer += "'
      );
    };

    var line = 1, c, callback;
    for (var i = 0, len = template.length; i < len; ++i) {
      if (template.slice(i, i + openTag.length) === openTag) {
        i += openTag.length;
        c = template.substr(i, 1);
        updateLine = '\nline = ' + line + ';';
        nextOpenTag = openTag;
        nextCloseTag = closeTag;
        hasTag = true;

        switch (c) {
        case "!": // comment
          i++;
          callback = null;
          break;
        case "=": // change open/close tags, e.g. {{=<% %>=}}
          i++;
          closeTag = "=" + closeTag;
          callback = setTags;
          break;
        case ">": // include partial
          i++;
          callback = includePartial;
          break;
        case "#": // start section
          i++;
          callback = openSection;
          break;
        case "^": // start inverted section
          i++;
          callback = openInvertedSection;
          break;
        case "/": // end section
          i++;
          callback = closeSection;
          break;
        case "{": // plain variable
          closeTag = "}" + closeTag;
          // fall through
        case "&": // plain variable
          i++;
          nonSpace = true;
          callback = sendPlain;
          break;
        default: // escaped variable
          nonSpace = true;
          callback = sendEscaped;
        }

        var end = template.indexOf(closeTag, i);

        if (end === -1) {
          throw debug(new Error('Tag "' + openTag + '" was not closed properly'), template, line, options.file);
        }

        var source = template.substring(i, end);

        if (callback) {
          callback(source);
        }

        // Maintain line count for \n in source.
        var n = 0;
        while (~(n = source.indexOf("\n", n))) {
          line++;
          n++;
        }

        i = end + closeTag.length - 1;
        openTag = nextOpenTag;
        closeTag = nextCloseTag;
      } else {
        c = template.substr(i, 1);

        switch (c) {
        case '"':
        case "\\":
          nonSpace = true;
          code.push("\\" + c);
          break;
        case "\r":
          // Ignore carriage returns.
          break;
        case "\n":
          spaces.push(code.length);
          code.push("\\n");
          stripSpace(); // Check for whitespace on the current line.
          line++;
          break;
        default:
          if (isWhitespace(c)) {
            spaces.push(code.length);
          } else {
            nonSpace = true;
          }

          code.push(c);
        }
      }
    }

    if (sectionStack.length != 0) {
      throw debug(new Error('Section "' + sectionStack[sectionStack.length - 1].name + '" was not closed properly'), template, line, options.file);
    }

    // Clean up any whitespace from a closing {{tag}} that was at the end
    // of the template without a trailing \n.
    stripSpace();

    code.push(
      '";',
      "\nreturn buffer;",
      "\n} catch (e) { throw {error: e, line: line}; }"
    );

    // Ignore `buffer += "";` statements.
    var body = code.join("").replace(/buffer \+= "";\n/g, "");

    if (options.debug) {
      if (typeof console != "undefined" && console.log) {
        console.log(body);
      } else if (typeof print === "function") {
        print(body);
      }
    }

    return body;
  }

  /**
   * Used by `compile` to generate a reusable function for the given `template`.
   */
  function _compile(template, options) {
    var args = "view,partials,stack,lookup,escapeHTML,renderSection,render";
    var body = parse(template, options);
    var fn = new Function(args, body);

    // This anonymous function wraps the generated function so we can do
    // argument coercion, setup some variables, and handle any errors
    // encountered while executing it.
    return function (view, partials) {
      partials = partials || {};

      var stack = [view]; // context stack

      try {
        return fn(view, partials, stack, lookup, escapeHTML, renderSection, render);
      } catch (e) {
        throw debug(e.error, template, e.line, options.file);
      }
    };
  }

  // Cache of pre-compiled templates.
  var _cache = {};

  /**
   * Clear the cache of compiled templates.
   */
  function clearCache() {
    _cache = {};
  }

  /**
   * Compiles the given `template` into a reusable function using the given
   * `options`. In addition to the options accepted by Mustache.parse,
   * recognized options include the following:
   *
   *   - cache    Set `false` to bypass any pre-compiled version of the given
   *              template. Otherwise, a given `template` string will be cached
   *              the first time it is parsed
   */
  function compile(template, options) {
    options = options || {};

    // Use a pre-compiled version from the cache if we have one.
    if (options.cache !== false) {
      if (!_cache[template]) {
        _cache[template] = _compile(template, options);
      }

      return _cache[template];
    }

    return _compile(template, options);
  }

  /**
   * High-level function that renders the given `template` using the given
   * `view` and `partials`. If you need to use any of the template options (see
   * `compile` above), you must compile in a separate step, and then call that
   * compiled function.
   */
  function render(template, view, partials) {
    return compile(template)(view, partials);
  }

})(Mustache);
var Wheel = {
  Mixins: {},
  Utils: {},
  Widgeteria: {}
};

!window.w && (window.w = Wheel);
Wheel.Utils.ObjectPath = {
  write: function(path, value, baseObject) {
    path = path.split('.');
    baseObject = baseObject || window;
    var length = path.length;
    var i;
    if (length > 1) {
      for (i = 0; i < length - 1; i++) {
        baseObject[path[i]] || (baseObject[path[i]] = {});
        baseObject = baseObject[path[i]];
      }
    }
    baseObject[path[length-1]] = value;
    return value;
  },

  read: function(path, baseObject) {
    path = path.split('.');
    baseObject = baseObject || window;
    var length = path.length;
    var i;
    for (i = 0; i < length; i++) {
      if (!baseObject[path[i]]) { return null; }
      baseObject = baseObject[path[i]];
    }
    return baseObject;
  }
};
/* And a little bit of Underscore ...
 * Licence:
 *  Underscore.js 1.3.3
    (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
    Underscore is freely distributable under the MIT license.
    Portions of Underscore are inspired or borrowed from Prototype,
    Oliver Steele's Functional, and John Resig's Micro-Templating.
    For all details and documentation:
    http://documentcloud.github.com/underscore
*/
(function(root) {
  if (root._) {
    Wheel.isFunction  = _.isFunction;
    Wheel.isString    = _.isString;
    Wheel.isNumber    = _.isNumber;
    Wheel.isNull      = _.isNull;
    Wheel.isUndefined = _.isUndefined;
    Wheel.isElement   = _.isElement;
    Wheel.isArray     = _.isArray;
    Wheel.isObject    = _.isObject;
  } else {
    Wheel.isFunction = function(obj) {
      return typeof obj === 'function' || toString.call(obj) == '[object Function]';
    };

    Wheel.isString = function(obj) {
      return toString.call(obj) == '[object String]';
    };

    Wheel.isNumber = function(obj) {
      return toString.call(obj) == '[object Number]';
    };

    Wheel.isNull = function(obj) {
      return obj === null;
    };

    Wheel.isUndefined = function(obj) {
      return obj === void 0;
    };

    Wheel.isElement = function(obj) {
      return !!(obj && obj.nodeType == 1);
    };

    Wheel.isArray = function(obj) {
      return toString.call(obj) == '[object Array]';
    };

    Wheel.isObject = function(obj) {
      return obj === Object(obj) && !Wheel.isFunction(obj) && !Wheel.isArray(obj);
    };
  }

  Wheel.is$ = function(obj) {
    return !!obj.addClass;
  };
})(window);
// This was stolen from Backbone and modified slightly.
Wheel.Mixins.Events = {
  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  on: function(events, callback, context) {
    var calls, event, node, tail, list;
    if (!callback) return this;
    events = events.split(' ');
    calls = this._callbacks || (this._callbacks = {});

    // Create an immutable callback list, allowing traversal during
    // modification.  The tail is an empty object that will always be used
    // as the next node.
    while (event = events.shift()) {
      list = calls[event];
      node = list ? list.tail : {};
      node.next = tail = {};
      node.context = context;
      node.callback = callback;
      calls[event] = {tail: tail, next: list ? list.next : node};
    }

    return this;
  },

  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  off: function(events, callback, context) {
    var event, calls, node, tail, cb, ctx;

    // No events, or removing *all* events.
    if (!(calls = this._callbacks)) return this;
    if (!(events || callback || context)) {
      delete this._callbacks;
      return this;
    }

    // Loop through the listed events and contexts, splicing them out of the
    // linked list of callbacks if appropriate.
    events = events ? events.split(' ') : _.keys(calls);
    while (event = events.shift()) {
      node = calls[event];
      delete calls[event];
      if (!node || !(callback || context)) continue;
      // Create a new list, omitting the indicated callbacks.
      tail = node.tail;
      while ((node = node.next) !== tail) {
        cb = node.callback;
        ctx = node.context;
        if ((callback && cb !== callback) || (context && ctx !== context)) {
          this.on(event, cb, ctx);
        }
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(events) {
    var event, node, calls, tail, args, all, rest, slice;
    if (!(calls = this._callbacks)) return this;
    slice = Array.prototype.slice;
    all = calls.all;
    events = events.split(' ');
    rest = slice.call(arguments, 1);

    // For each event, walk through the linked list of callbacks twice,
    // first to trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      if (node = calls[event]) {
        tail = node.tail;
        while ((node = node.next) !== tail) {
          node.callback.apply(node.context || this, rest);
        }
      }
      if (node = all) {
        tail = node.tail;
        args = [event].concat(rest);
        while ((node = node.next) !== tail) {
          node.callback.apply(node.context || this, args);
        }
      }
    }

    return this;
  }

};

Wheel.Mixins.Ajax = {
  send: function (overrides) {
    this._requestQueue = this._requestQueue || Wheel.Utils.RequestQueue.singleton;
    var data = this.data();

    var opts = {
      url: this.url,
      context: this,
      data: data,
      type: (overrides && overrides.httpMethod) || this.httpMethod,
      dataType: this.dataType || 'json',
      success: this.onSuccess,
      error: this.processError,
      complete: this.onCompletion
    };
    overrides && $.extend(opts, overrides);
    this._requestQueue.add(opts);
  },

  processError: function (xhr) {
    try {
      this.onError(JSON.parse(xhr.responseText));
    } catch(e) {
      this.onError({status: xhr.statusCode(), message: xhr.responseText});
    }
  },

  // reimplement these in classes
  data: function() { return {}; },
  onCompletion: function(response) {},
  onSuccess:    function(response) {},
  onError:      function(response) {}
};
/*
 * Object Orientation inspired by John Resig's post on simple class inheritance
 * http://ejohn.org/blog/simple-javascript-inheritance/
 *
 */

// The foundation of Wheel.js is a
(function(){
  Function.prototype.bind = Function.prototype.bind || function(context) {
    var func = this;
    return function() {
      return func.apply(context, arguments);
    };
  };

  /* taken from Ember.js! */
  var wrap = function(func, superFunc) {
    function K() {}

    var newFunc = function() {
      var ret, sup = this._super;
      this._super = superFunc || K;
      ret = func.apply(this, arguments);
      this._super = sup;
      return ret;
    };

    newFunc.base = func;
    return newFunc;
  };

  var superExtend = function(base, props, mashing) {
    if (!props) { return base; }

    for(prop in props) {
      // don't copy intrinsic properties
      if ( prop.match(/prototype|__proto__|superclass/) ) { continue; }

      var bottom, top;
      if (mashing) {
        bottom = props[prop];
        top = base[prop];
      } else {
        bottom = base[prop];
        top = props[prop];
      }

      if ( bottom && top && (typeof top == 'function') ) {
        base[prop] = (function(func, _super){
          return wrap(func, _super);
        })(top, bottom);
      } else if (top || bottom) {
        base[prop] = top || bottom;
      }
    }
    return base;
  };

  Wheel._Class = function() {};

  Wheel._Class.mashin = function(props) {
    superExtend(this, props, true);
    return this;
  };

  Wheel._Class.mashover = function(props) {
    superExtend(this, props);
    return this;
  };

  Wheel._Class.mixin = function(props) {
    superExtend(this.prototype, props, true);
    return this;
  };

  Wheel._Class.mixover = function(props) {
    superExtend(this.prototype, props);
    return this;
  };


  var initializing = false;
  Wheel._Class.subclass = function() {
    var id, proto, iProps, cProps;
    if (typeof arguments[0] == 'string') {
      id = arguments[0];
      iProps = arguments[1];
      cProps = arguments[2];
    } else {
      iProps = arguments[0];
      cProps = arguments[1];
    }

    initializing = true;
    proto = new this();
    initializing = false;

    // high level constructor
    function Class() {
      if (!initializing) {
        if (this.initialize) {
          this.initialize.apply(this, arguments);
        }
      }
    }

    // add existing class method from old class
    for( prop in this ) {
      var prop;
      if ( prop == 'prototype' ) { continue; }
      Class[prop] = this[prop];
    }

    superExtend(Class, cProps);
    Class.superclass = this;
    Class._subclass = Wheel._Class.subclass;
    Class.prototype = superExtend(proto, iProps);
    Class.prototype.constructor = Class;
    Class.prototype.superclass = this.prototype;
    Class.prototype._class = Class.prototype.constructor; // more intuitive access ??

    if (id) {
      Class.id = id;
      Wheel.Utils.ObjectPath.write(id, Class);
    }
    return Class;
  };
})();
Wheel._Class.subclass('Wheel.Base', {
  initialize: function(opts) {
    this._preInit(opts);
    this.init();
    this._postInit();
  },

  _preInit: function(opts) {
    this._uid = this._class.uid();
    this.optionize(opts);
  },

  _postInit: function() {
    this.listen();
  },

  optionize: function(opts) {
    var normalOpts = {};
    var opt;
    for( opt in opts ) {
      if ( typeof this._class.prototype[opt] == 'function' ) {
        // is a property
        this['_'+opt] = opts[opt];
      } else {
        this[opt] = opts[opt];
      }
    }
  },

  init: function() {
    // overloaded by subclasses
  },

  listen: function() {
    // yup, this too
  },

  publish: function(eventType, eventData) {
    this._throwIfNoPublisher();
    Wheel.Publisher.trigger(eventType, eventData);
  },

  subscribe: function(eventName, callback, context) {
    this._throwIfNoPublisher();
    Wheel.Publisher.on(eventName, callback, context || this);
  },

  _throwIfNoPublisher: function() {
    if (!Wheel.Publisher) {
      throw "Wheel.Publisher is not defined. We cannot use publish/subscribe yet!";
    }
  }
}, {
  uid: function() {
    Wheel.Base._uid = Wheel.Base._uid || 0;
    return ++ Wheel.Base._uid;
  },

  build: function() {
    var klass = this;

    function creator(args) {
      return klass.apply(this, args);
    }
    creator.prototype = klass.prototype;

    return new creator(arguments);
  },

  attrAccessor: function(prop) {
    var propId = '_'+prop;
    this.prototype[prop] = function(value){
      if (value !== undefined) {
        this[propId] = value;
        if (self[propId] != value) {
          this.trigger('change');
          this.trigger('change:'+prop);
        }
      }
      return this[propId];
    };
  },

  subclass: function(name, iprops, cprops) {
    var klass = this._subclass(name, iprops, cprops);
    if (klass.properties && klass.properties.length) {
      $.each(klass.properties, function(i, prop) {
        if ( typeof klass.prototype[prop] != 'function' ) {
          klass.attrAccessor(prop);
        }
      });
    }
    if (Wheel.isString(name)) {
      var path = name.split('.');
      var length = path.length;
      var i, base = window;
      for (i = 0; i < length-1; i++) {
        var base = window[path[i]];
        if (base && base._typeof === 'Wheel.App') {
          klass.App = base;
          break;
        }
      }
    }
    return klass;
  }
});

Wheel.Base.mixin(Wheel.Mixins.Events);

Wheel.Class = function(x, y, z) {
  return Wheel.Base.subclass(x, y, z);
};
Wheel.Base.subclass('Wheel.Class.Singleton', {
  initialize: function(opts) {
    if (!this._class.singleton) {
      this._class.singleton = this;
      this._super(opts);
    }
  }
}, {
  build: function() {
    if (this.singleton) {
      return this.singleton;
    } else {
      return this._super.apply(this, arguments);
    }
  }
});
Wheel.Utils.Loader = {
  canZepto: function(agent) {
    agent = agent || navigator.userAgent;
    var is = false;

    if ( /AppleWebKit/i.test(agent) ) {
      if ( /Silk\/(\d+)/i.test(agent) ) { // amazon silk
        is = parseInt(agent.match(/Silk\/(\d+)/i)[1]) >= 1;
      } else if (/mobile|android/i.test(agent) ) { // general mobile
        is = parseInt(agent.match(/version\/(\d+)/i)[1]) >= 4;
      } else if ( /webos\/(\d+)\.(\d+)\.(\d+)/i.test(agent) ) { // palm
        is = this._versionTest(agent.match(/webos\/(\d+)\.(\d+)\.(\d+)/i), [1,4,5]);
      } else if ( /RIM Tablet OS (\d+)\.(\d+)\.(\d+)/i.test(agent) ) { // blackberry tablet
        is = this._versionTest(agent.match(/RIM Tablet OS (\d+)\.(\d+)\.(\d+)/i), [1,0,7]);
      } else { // desktop webkit browsers
        is = (
          ( agent.match(/Chrome\/(\d+)/) && parseInt(agent.match(/Chrome\/(\d+)/)[1]) >= 5 ) ||
          /Version\/5.*Safari/.test(agent)
        );
      }
    } else {
      is = (
        ( agent.match(/Firefox\/(\d+)/) && parseInt(agent.match(/Firefox\/(\d+)/)[1]) >= 4 ) ||
        ( agent.match(/(Opera).*Version\/(\d+)/i) && parseInt(agent.match(/Version\/(\d+)/i)[1]) >= 10 )
      )
    }

    return !!is;
  },

  _versionTest: function (matches, required) {
    matches[1] = parseInt(matches[1]);
    matches[2] = parseInt(matches[2]);
    matches[3] = parseInt(matches[3]);
    return matches[1] >= required[0] &&
      ( matches[2] > required[1] || (matches[2] == required[1] && matches[3]>= required[2]) ) ;
  }
};


// Even though this is a technically a fill for navigator.online, that
// property only checks to make sure that there is a connection.
// If the connection is not sending/receiving requests, the flag
// will be incorrect. This is a good backup to test real connectivity.
Wheel.Class.Singleton.subclass('Wheel.Utils.ConnectionChecker', {
  init: function() {
    this.url = '/';
    this.intervalDelay = this._class.intervalDelay;
    this.pollCount = 0;
    this._super();
  },

  opts: {
    async: false,
    url: this.url,
    context: this,
    type: 'head',
    dataType: 'json'
  },

  test: function() {
    $.ajax($.extend(this.opts, {
      success: this.onSuccess,
      error: this.onError
    }));
  },

  clearInterval: function() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  },

  setInterval: function() {
    this.interval = setInterval(function() {
      $.ajax($.extend(this.opts, {
        success: self.stopPoll,
        error: self.continuePoll
      }));
    }, this.intervalDelay);
  },

  startPoll: function() {
    var self = this;
    this.pollCount = 1;
    this.setInterval();
  },

  isPolling: function() {
    return !!this.interval;
  },

  stopPoll: function() {
    this.clearInterval();
    this.intervalDelay = this._class.intervalDelay;
    this.pollCount = 0;
    this.onSuccess();
  },

  continuePoll: function() {
    this.pollCount ++;
    if (this.pollCount > 10 && this.intervalDelay < this._class.intervalDelayLimit) {
      this.clearInterval();
      this.intervalDelay *= 2;
      this.setInterval();
      this.pollCount = 0;
    }
  },

  onSuccess: function(response) {
    this.trigger('online');
  },

  onError: function(response) {
    this.trigger('offline');
    !this.isPolling() && this.startPoll();
  }
}, {
  intervalDelay: 10*1000,
  intervalDelayLimit: 2*60*1000,
  id: 'Wheel.Utils.ConnectionChecker'
});

Wheel.Utils.ConnectionChecker.mixin(Wheel.Mixins.Events);
Wheel.Class.Singleton.subclass('Wheel.Utils.RequestQueue', {
  init: function() {
    this._requestCount = 0;
    this._requests = [];
    this._contexts = {};
    this._state = 'online';
    this.app.on('offline', this.offline, this);
    //this.app.on('offline offline-beacon', this.saveState, this);
  },

  add: function(requestOpts) {
    this._requests.push(requestOpts);
    this.start();
  },

  _inContext: function(context) {
    return !!(context && context._uid && this._contexts[context._uid]);
  },

  start: function(index) {
    index = index || 0;
    var opts = this._requests[index];
    if (  opts && this._state == 'online' && this.app.connected() &&
          this._requestCount < this._class.connectionLimit() ) {
      var context =  opts.context && opts.context._uid;
      if ( !opts._inProgress && !this._inContext(opts.context) ) {
        this.send(opts);
        this._requests[index]._inProgress = true;
        context && (this._contexts[context] = true);
        this._requestCount ++;
      }
      this.start(index + 1);
    }
  },

  offline: function() {
    this._state = 'offline';
    this.app.on('online', this.restart, this);
  },

  restart: function() {
    this.app.off('online', this.restart);
    this._state = 'restarting';
    var self = this;
    setTimeout(function() {
      self._reset();
    }, 5000);
  },

  _reset: function() {
    if (this._state == 'restarting') {
      this.start();
      this._requestCount = 0;
      this._contexts = {};
      $.each(this._requests, function(i, request) {
        request._inProgress && (request._inProgress = false);
      });
    }
  },

  send: function(originalOpts) {
    var self = this;
    var opts = $.extend({}, originalOpts);
    opts.success = function(response) {
      self.onSuccess(response, originalOpts);
    };
    opts.complete = function(response) {
      self.onComplete(response, originalOpts);
    };
    opts.error = function(response) {
      self.onError(response, originalOpts);
    };

    typeof opts.url == 'function' && (opts.url = opts.url());

    var type = (opts.httpMethod || opts.type || 'get').toLowerCase();
    if (type == 'put' || type == 'delete') {
      opts.type = 'post';
      opts.data = opts.data || {};
      opts.data._method = type;
    }

    opts.context = null; // to avoid it calling the original context's success method

    $.ajax(opts);
  },

  onSuccess: function(response, opts) {
    this._clearRequest(opts);
    this._callback(response, opts, 'success');
  },

  onError: function(response, opts) {
    this.app.checkConnection(); // should be non asych
    if (this.app.connected()) {
      this._clearRequest(opts);
      this._callback(response, opts, 'error');
    }
  },

  onComplete: function(response, opts) {
    this._requestCount --;
    if (this.app.connected()) {
      this._callback(response, opts, 'complete');
      this.start();
    }
  },

  _clearRequest: function(opts) {
    if (opts.context && opts.context._uid) {
      delete this._contexts[opts.context._uid];
    }
    this._requests.splice(this._requests.indexOf[opts], 1);
  },

  _callback: function(response, opts, name) {
    if (opts[name]) {
      if (opts.context) {
        opts[name].apply(opts.context, [response]);
      } else {
        opts[name](response);
      }
    }
  }
}, {
  connectionLimit: function() {
    if (!this._connectionLimit) {
      this._connectionLimit = (Wheel.Utils.Loader.canZepto() ? 6 : 2);
    }
    return this._connectionLimit;
  },

  id: 'Wheel.Utils.RequestQueue'
});
Wheel.Class('Wheel.App', {
  _preInit: function(opts) {
    this._super(opts);
    this.initApp();
    this._class.app = this;
    window.app = this;
  },

  initApp: function() {
    this.eventManager = Modernizr.touch ? Wheel.TouchManager.build() : Wheel.MouseManager.build();
    this.templates = Wheel.Templates.build();
    this.templates.gather(); // no harm, no foul
  },

  manageRequests: function() {
    this.connectionChecker = Wheel.Utils.ConnectionChecker.build();
    this.requestQueue = Wheel.Utils.RequestQueue.build({app: this});

    this.connectionChecker.on('offline', function() {
      this.connected(false);
    }.bind(this));

    this.connectionChecker.on('online', function() {
      this.connected(true);
    }.bind(this));
  },

  checkConnection: function() {
    if ( ('onLine' in navigator) && (navigator.onLine == false)) {
      this.connected(false);
    } else {
      this.connectionChecker.test();
    }
  },

  connected: function(value) {
    if (value != undefined && this._connected != value) {
      var event = value ? 'online' : 'offline';
      this._connected = value;
      this.trigger(event);
    }
    if (value === false) {
      this.trigger('offline-beacon');
    }
    return this._connected;
  }
}, {
  Views: {},
  Models: {},
  _typeof: 'Wheel.App',

  subclass: function(name, iprops, cprops) {
    this.children = this.children || [];
    var klass = this._super(name, iprops, cprops);
    this.children.push(klass);
    return klass;
  },

  start: function() {
    this.children && $.each(this.children, function(i, klass) {
      klass.build();
    });
  }
});
Wheel.Class.Singleton.subclass('Wheel.Templates', {
  optionize: function(opts) {
    this.append(opts);
  },

  gather: function() {
    var self = this;
    $('script.template').each(function(index, template) {
      var $template = $(template);
      Wheel.Utils.ObjectPath.write($template.attr('name'), $template.html(), self);
    });
  },

  retrieve: function(url) {
    var self = this;
    $.ajax({
      url: url || '/templates',
      success: function(response) {
        self.append(response);
      }
    });
  },

  append: function(templates) {
    var key;
    for (key in templates) {
      Wheel.Utils.ObjectPath.write(key, templates[key], this);
    }
  }
});
Wheel.Class('Wheel.View', {
  initialize: function(dom, opts) {
    this.initializeDom(dom, opts);
    this.init();
    this._postInit();
  },

  initializeDom: function(dom, opts) {
    if ( dom && (dom.addClass || dom instanceof HTMLElement || Wheel.isString(dom) ) ) {
      this._preInit(opts);
      this.$ = this.wrapDom(dom);
    } else {
      this._preInit(dom);
      this.$ = this.renderDefault();
    }
  },

  wrapDom: function(dom) {
    return $(dom);
  },

  renderDefault: function() {
    var rendered = this.renderTemplate();
    this.parent && this.appendToParent(rendered);
    return rendered;
  },

  renderTemplate: function(keyOrData, data) {
    var key;
    if ( Wheel.isString(keyOrData) ) {
      key = keyOrData;
    } else {
      data = keyOrData;
    }
    return $(Mustache.render(this._class.template(key), data || this.viewModel()));
  },

  appendToParent: function(rendered) {
    this.parent.append ? this.parent.append(rendered) : $(this.parent).append(rendered);
  },

  viewModel: function() {
    var view;
    if ( this.model ) {
      view = this.model;
    } else {
      view = this;
    }
    return view;
  },


  // delegates to the dom manager
  _delegate: function(method, obj) {
    if ($.isArray(obj)) {
      var self = this;
      $.each(obj, function(index, o) {
        self._delegateOne(method, o);
      });
    } else {
      this._delegateOne(method, obj);
    }
  },

  _delegateOne: function(method, obj) {
    this.$[method](obj.$ || obj);
  },

  append: function(obj) {
    this._delegate('append', obj);
  },

  prepend: function(obj) {
    this._delegate('prepend', obj);
  },

  find: function(obj) {
    this._delegateOne(obj);
  }
},{
  templateRepository: function() {
    if (!this._templateRepository) {
      this._templateRepository = this._getTemplateRepository();
    }
    return this._templateRepository;
  },

  _getTemplateRepository: function() {
    return window.app && window.app.templates;
  },

  templates: function() {
    if (!this._templates) {
      this._templates = Wheel.Utils.ObjectPath.read(this.id, this.templateRepository());
      var superTemplates = this.superclass.templates && this.superclass.templates();
      if (superTemplates && this._templates) {
        var key;
        for(key in superTemplates) {
          if (!this._templates[key]) { this._templates[key] = superTemplates[key]; }
        }
      }
    }
    return this._templates;
  },

  defaultTemplate: 'default',

  template: function(key) {
    var templates = this.templates();
    if (!templates) {
      throw "No templates found for View: " + this.id;
    }
    var template;
    if (Wheel.isString(templates)) {
      template = templates;
    } else {
      template = key ? templates[key] : templates[this.defaultTemplate];
    }
    return template;
  },

  // only applicable for finding things in an established dom
  gather: function(dom, opts) {
    if (!this.selector) {
      throw "Define a selector on the class to use the 'gather' class method";
    }
    var set = [],
        klass = this;
    if (Wheel.isObject(dom) && !Wheel.isElement(dom)) {
      opts = dom;
      dom = $(document.body);
    } else {
      opts = opts || {};
      dom = Wheel.is$(dom) ? dom : $(dom);
    }

    if (dom.is(this.selector)) {
      set.push(new klass(dom, opts));
    } else {
      $.each(dom.find(this.selector), function(index, item) {
        set.push(new klass(item, opts));
      });
    }

    return set;
  },

  assemble: function(models, opts) {
    var views = [];
    opts = opts || {};
    $.each(models, function(i, model) {
      opts.model = model;
      views.push(this.build(opts));
    }.bind(this));
    return views;
  }
});
/* This was inspired by Zepto.js */
Wheel.View.subclass('Wheel.EventManager', {
  initializeDom: function(opts) {
    this.optionize(opts);
    this.$ = $(document);
  },

  listen: function() {
    var self = this;
    this.$.on('draginit', function(e) {
      self.onDragInit(e);
    });
  },

  onDragInit: function(e) {
    e.preventDefault();
    this._setTarget(e);
    this.touch.type = 'drag';
    e = this._unpackEvent(e);
		this._triggerEvent(e, 'dragstart');
  },

  onStart: function(e) {
    this.touch.ctrl = e.ctrlKey;
    e = this._normalizeEvent(e);
    this._setTarget(e);

    // this is the normalized start event
    this._triggerEvent(e, 'tapstart');

    // clear existing timeout because there is a new touch start event
    // timeouts are set for 'taphold' and/or for 'tap'
    this._clearTimeout();

    // set up the touch object
    this.touch.x1 = e.pageX;
    this.touch.y1 = e.pageY;
    this.touch.time = Date.now();

    if (!this._testDoubleTap() && !this.touch.ctrl) {
      // wait to see if this is a taphold event
      var self = this;
      this.touchTimout = setTimeout(function() {
        self._testTouchhold(e);
      }, this.HOLD_DELAY);
    }
  },

  onMove: function(e) {
    this._handleDragMove(e);
    if (this.touch.type) { return; }
    e = this._unpackEvent(e);
    this._testSwipe(e);
  },

  onEnd: function(e) {
    e = this._unpackEvent(e);
    this._triggerEvent(e, 'tapend');
    this._handleDragEnd(e);
    if (this.touch.type || this.touch.ctrl) {
      this._resetTouch();
    } else {
      this._handleTap(e);
    }
  },

  _triggerEvent: function(originalEvent, altType) {
    if (!this.target) { return; }
    var x = 'x2' in this.touch ? this.touch.x2 : this.touch.x1;
    var y = 'y2' in this.touch ? this.touch.y2 : this.touch.y1;

    this.target.trigger($.Event(altType || this.touch.type, {
      originalEvent: originalEvent,
      pageX: x,
      pageY: y
    }));
  },

  _setTarget: function(e) {
    var node = e.target;
    this.target = $('tagName' in node ? node : node.parentNode);
  },

  _clearTimeout: function() {
    this.touchTimeout && clearTimeout(this.touchTimeout);
  },

  _resetTouch: function() {
    this.lastTouch = this.touch;
    this.lastTouch.target = this.target;
    this.target = null;
    this.touch = {};
  },

  _normalizeEvent: function(e) {
    return e;
  },

  _unpackEvent: function(e) {
    e = this._normalizeEvent(e);

    if (e.type !== 'touchend') {
      this.touch.x2 = e.pageX >= 0 ? e.pageX : this.touch.x1;
      this.touch.y2 = e.pageY >= 0 ? e.pageY : this.touch.y1;
    }

    return e;
  },

  _handleTap: function(e) {
    if (this.RESPONSIVE_TAP) {
      this._onTap(e);
    } else {
      // wait to see if it is a tap, or if it is a double tap
      var self = this;
      this.touchTimeout = setTimeout(function(){
        self._onTap(e);
      }, this.DOUBLE_DELAY);
    }
  },

  _handleDragMove: function(e) {
    if (this.touch.type && this.touch.type === 'drag') {
      e.preventDefault();
      e = this._unpackEvent(e);
      this._triggerEvent(e, 'dragmove');
    }
  },

  _handleDragEnd: function(e) {
    if (this.touch.type && this.touch.type === 'drag') {
      e = this._unpackEvent(e);
      this._triggerEvent(e, 'dragend');
    }
  },

  _onTap: function(e) {
    this.touchTimeout = null;
    if ( this.target && e.target === this.target[0] &&
          this.TAP_TOLERANCE >= Math.abs(this.touch.x1 - this.touch.x2) &&
          this.TAP_TOLERANCE >= Math.abs(this.touch.y1 - this.touch.y2) ) {
      this.touch.type = 'tap';
      this._triggerEvent(e);
    }
    this._resetTouch();
  },

  _testDoubleTap: function(e) {
    // what about checking for distance from original tap
    var delta = this.lastTouch && this.lastTouch.time ? this.touch.time - this.lastTouch.time : 0;
    if (delta > 0 && delta <= this.DOUBLE_DELAY) {
      this.touch.type = 'doubletap';
      this._triggerEvent(e);
      return true;
    }
  },

  _testSwipe: function(e) {
    // if we have moved a certain distance, call it a swipe
    if (Math.abs(this.touch.x1 - this.touch.x2) >= this.SWIPE_TOLERANCE ||
        Math.abs(this.touch.y1 - this.touch.y2) >= this.SWIPE_TOLERANCE) {
      this.touch.type = 'swipe';
      var _direction = this._direction(this.touch.x1, this.touch.x2, this.touch.y1, this.touch.y2);
      if ( this.preventScroll(_direction) ) {
        e.preventDefault();
      }
      this._triggerEvent(e);
      this._triggerEvent(e, "swipe" + _direction);
    }
  },

  _testTouchhold: function(e) {
    if (this.touch.type) { return; }
    var x1 = this.touch.x1,
        y1 = this.touch.y1;
        x2 = ('x2' in this.touch) ? this.touch.x2 : x1;
        y2 = ('y2' in this.touch) ? this.touch.y2 : y1;

    if ((this.touch.time && (Date.now() - this.touch.time >= this.HOLD_DELAY)) &&
        (Math.abs(x1 - x2) <= this.HOLD_TOLERANCE) &&
        (Math.abs(y1 - y2) <= this.HOLD_TOLERANCE)) {
      this.touch.type = 'taphold';
      this._triggerEvent(e);
    }
  },

  _direction: function(x1,x2, y1,y2) {
    var xDelta = Math.abs(x1 - x2),
        yDelta = Math.abs(y1 - y2);
    if (xDelta >= yDelta) {
      return (x1 - x2 > 0 ? 'left' : 'right');
    } else {
      return (y1 - y2 > 0 ? 'up' : 'down');
    }
  },

  // customizations
  preventScroll: function() { return false; },
  HOLD_DELAY: 750,
  DOUBLE_DELAY: 250,
  HOLD_TOLERANCE: 10,
  SWIPE_TOLERANCE: 60,
  TAP_TOLERANCE: 10,
  RESPONSIVE_TAP: true,
  GESTURE_TOLERANCE: 20
});
Wheel.EventManager.subclass('Wheel.TouchManager', {
  listen: function() {
    this._super();
    var self = this;
    this.touch = {};

    this.$
      .on(this.startEvent, function(e) {
        self.onStart(e);
      })
      .on(this.moveEvent, function(e) {
        self.onMove(e);
      })
      .on(this.endEvent, function(e) {
        self.onEnd(e);
      });
  },

  onStart: function(e) {
    e = this._unpackEvent(e);
    this._super(e);
  },

  onMove: function(e) {
    this._handleDragMove(e);
    if (this.touch.type) { return; }
    e = this._unpackEvent(e);
    this.multi && this._detectGesture(e);
    this._testSwipe(e);
  },

  onEnd: function(e) {
    this._super(e);
    this.multi = undefined;
  },

  _multiDistance: function(index) {
    return Math.sqrt(
      Math.pow(this.touch['x' + index] - this.multi['x' + index], 2) +
      Math.pow(this.touch['y' + index] - this.multi['y' + index], 2)
    );
  },

  _detectGesture: function(e) {
    var origDist = this._multiDistance(1);
    var newDist =  this._multiDistance(2);
    var deltaDist = Math.abs(origDist - newDist);
    var xDeltaSwipe = Math.abs(
      (this.touch.x1 - this.touch.x2) -
      (this.multi.x1 - this.multi.x2)
    );
    var yDeltaSwipe = Math.abs(
      (this.touch.y1 - this.touch.y2) -
      (this.multi.y1 - this.multi.y2)
    );

    if ( deltaDist >= this.GESTURE_TOLERANCE &&
         deltaDist >= xDeltaSwipe &&
         deltaDist >= yDeltaSwipe ) {
      this.touch.type = origDist > newDist ? 'pinch' : 'zoom';
      this._triggerEvent(e);
    }
  },

  _normalizeEvent: function(e) {
    if (e.normalized) { return e; }

    e = e.originalEvent || e;

    if (e.touches && e.touches[0]) {
      e.pageX = e.touches[0].pageX;
      e.pageY = e.touches[0].pageY;
    } else if (e.changedTouches && e.changedTouches[0]) { 
      // touchend has no touches ... the fuckers
      e.pageX = e.changedTouches[0].pageX;
      e.pageY = e.changedTouches[0].pageY;
      this.touch.x2 = e.changedTouches[0].pageX;
      this.touch.y2 = e.changedTouches[0].pageY;
    } else {
      // what is this strange beast??
      // console.log('e', e);
    }
    e.normalized = true;
    return e;
  },

  _unpackEvent: function(e) {
    e = this._super(e);

    if (e.touches && e.touches.length > 1) {
      if (this.multi) {
        this.multi.x2 = e.touches[1].pageX;
        this.multi.y2 = e.touches[1].pageY;
      } else {
        this.multi = {
          x1: e.touches[1].pageX,
          y1: e.touches[1].pageY
        };
      }
    }
    return e;
  },

  _handleTap: function(e) {
    if (this.multi) { return; }
    this._super(e);
  },

  startEvent: 'touchstart',
  moveEvent:  'touchmove',
  endEvent:   'touchend'
}, {
  id: 'Wheel.TouchManager'
});

Wheel.EventManager.subclass('Wheel.MouseManager', {
  listen: function() {
    this._super();
    var self = this;
    this.touch = {};

    function onMove(e) {
      self.onMove(e);
    }

    function onEnd(e) {
      self.onEnd(e);
      self.$.off(self.moveEvent, onMove);
    }

    // only listen for touchmove when a mousedown event
    // has occurred
    this.$.on(this.startEvent, function(e) {
      self.onStart(e);
      self.$.on(self.moveEvent, onMove);
    });

    this.$.on(this.endEvent, onEnd);
  },

  startEvent: 'mousedown',
  moveEvent:  'mousemove',
  endEvent:   'mouseup'
});
