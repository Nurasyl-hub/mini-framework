(function (global) {
  'use strict';

  function h(tag, attrs) {
    var children = [];
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (Array.isArray(c)) children = children.concat(flatten(c));
      else if (c !== null && c !== undefined && c !== false) children.push(c);
    }
    return { tag: tag, attrs: attrs || {}, children: children };
  }

  function flatten(arr) {
    var out = [];
    arr.forEach(function (item) {
      if (Array.isArray(item)) out = out.concat(flatten(item));
      else if (item !== null && item !== undefined && item !== false) out.push(item);
    });
    return out;
  }

  var DOM_PROPS = { checked: 1, value: 1, selected: 1, disabled: 1, autofocus: 1, readOnly: 1 };

  function applyAttrs(el, attrs) {
    Object.keys(attrs).forEach(function (key) {
      var val = attrs[key];
      if (key.startsWith('on') && typeof val === 'function') {
        Events.on(el, key.slice(2).toLowerCase(), val);
      } else if (key === 'class' || key === 'className') {
        el.className = val || '';
      } else if (key === 'for' || key === 'htmlFor') {
        el.setAttribute('for', val);
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (DOM_PROPS[key]) {
        el[key] = val;
      } else {
        el.setAttribute(key, String(val));
      }
    });
  }

  function createEl(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(String(vnode));
    }
    var el = document.createElement(vnode.tag);
    applyAttrs(el, vnode.attrs);
    vnode.children.forEach(function (child) {
      el.appendChild(createEl(child));
    });
    return el;
  }

  var Events = (function () {
    var registry = new WeakMap();

    function getMap(el) {
      if (!registry.has(el)) registry.set(el, {});
      return registry.get(el);
    }

    return {
      on: function (el, event, handler) {
        var map = getMap(el);
        if (!map[event]) map[event] = [];
        map[event].push(handler);
        el.addEventListener(event, handler);
      },

      off: function (el, event, handler) {
        var map = getMap(el);
        if (map[event]) {
          map[event] = map[event].filter(function (h) { return h !== handler; });
        }
        el.removeEventListener(event, handler);
      },

      emit: function (el, event, detail) {
        el.dispatchEvent(new CustomEvent(event, { detail: detail || {}, bubbles: true }));
      },

      once: function (el, event, handler) {
        var self = this;
        var wrap = function (e) { handler(e); self.off(el, event, wrap); };
        this.on(el, event, wrap);
      }
    };
  })();

  function createStore(initialState, reducer) {
    var state = Object.assign({}, initialState);
    var listeners = [];

    return {
      getState: function () { return Object.assign({}, state); },

      dispatch: function (action) {
        state = reducer(state, action);
        listeners.forEach(function (fn) { fn(state); });
      },

      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          listeners = listeners.filter(function (l) { return l !== fn; });
        };
      }
    };
  }

  function createRouter() {
    var routes = {};

    function resolve() {
      var path = window.location.hash.slice(1) || '/';
      var handler = routes[path] || routes['*'];
      if (handler) handler(path);
    }

    window.addEventListener('hashchange', resolve);

    return {
      addRoute: function (path, fn) { routes[path] = fn; return this; },

      navigate: function (path) { window.location.hash = path; },

      current: function () { return window.location.hash.slice(1) || '/'; },

      start: function () { resolve(); return this; }
    };
  }

  function createApp(options) {
    var container = typeof options.el === 'string'
      ? document.querySelector(options.el)
      : options.el;

    function update() {
      var state = options.store ? options.store.getState() : {};
      container.innerHTML = '';
      container.appendChild(createEl(options.render(state)));
      if (typeof options.afterRender === 'function') options.afterRender(container);
    }

    if (options.store) options.store.subscribe(update);
    update();
    return { update: update };
  }

  global.MiniF = {
    h: h,
    createEl: createEl,
    Events: Events,
    createStore: createStore,
    createRouter: createRouter,
    createApp: createApp
  };

})(window);
