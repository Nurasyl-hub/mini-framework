# MiniF — Mini JavaScript Framework

A lightweight, zero-dependency framework built from scratch.  
It implements **Virtual DOM · State Management · Routing · Event Handling** — all in one small file (`framework/core.js`, ~160 lines).

---

## 📁 Project Structure

```
mini-framework/
├── framework/
│   └── core.js        ← The entire framework
├── todo/
│   ├── index.html     ← TodoMVC app entry point
│   ├── app.js         ← TodoMVC app logic
│   └── style.css      ← TodoMVC styles
└── README.md
```

**To run the TodoMVC app**, open `todo/index.html` in a browser (or serve the folder with any static server).

```bash
# Using Python:
cd mini-framework && python3 -m http.server 8080
# Then open: http://localhost:8080/todo/
```

---

## How It Works

MiniF follows a **unidirectional data flow** — the same pattern used by React + Redux:

```
User Action → dispatch(action) → reducer → new state → re-render
```

The framework calls *your* `render` function whenever state changes — **you never touch the DOM directly**. This is what makes it a framework, not a library: control is inverted.

---

## API Reference

### 1. Virtual DOM — `MiniF.h()`

`h()` creates a **virtual node** — a plain JavaScript object describing what the DOM should look like.

```js
MiniF.h(tag, attrs, ...children)
```

| Param      | Type               | Description                              |
|------------|--------------------|------------------------------------------|
| `tag`      | `string`           | HTML element tag name (`'div'`, `'p'`…)  |
| `attrs`    | `object \| null`   | Attributes, properties, and event handlers |
| `children` | `string \| vnode`  | Text nodes or nested `h()` calls        |

**Create an element:**
```js
var div = MiniF.h('div', { class: 'box' }, 'Hello World');
// Produces: <div class="box">Hello World</div>
```

**Nest elements:**
```js
var nav = MiniF.h('nav', { class: 'menu' },
  MiniF.h('a', { href: '#/' },  'Home'),
  MiniF.h('a', { href: '#/about' }, 'About')
);
```

**Add attributes:**
```js
MiniF.h('input', {
  type: 'text',
  placeholder: 'Type here…',
  class: 'my-input',
  disabled: true
})
```

**Conditional children** — `null` / `false` are ignored:
```js
MiniF.h('div', {},
  isLoggedIn ? MiniF.h('span', {}, 'Welcome!') : null
)
```

**Lists with `.map()`:**
```js
MiniF.h('ul', {},
  items.map(function(item) {
    return MiniF.h('li', {}, item.name);
  })
)
```

---

### 2. Event Handling — `MiniF.Events`

MiniF provides its own event API. **Never call `addEventListener` in your app code** — always use `MiniF.Events`.

#### `Events.on(el, event, handler)`
Attach a handler to a DOM element.
```js
var btn = document.querySelector('#myBtn');
MiniF.Events.on(btn, 'click', function(e) {
  console.log('clicked!');
});
```

#### `Events.off(el, event, handler)`
Remove a previously attached handler.
```js
MiniF.Events.off(btn, 'click', myHandler);
```

#### `Events.emit(el, event, detail)`
Dispatch a custom event with an optional data payload.
```js
MiniF.Events.emit(btn, 'app:save', { id: 42 });

// Listen for it anywhere in the DOM:
MiniF.Events.on(document.body, 'app:save', function(e) {
  console.log(e.detail.id); // 42
});
```

#### `Events.once(el, event, handler)`
Fires the handler exactly once, then removes it.
```js
MiniF.Events.once(btn, 'click', function() {
  console.log('fired only the first time');
});
```

#### Inline events in virtual DOM
Pass event handlers as `on` + event name (camelCase) in `attrs`:
```js
MiniF.h('button', {
  onClick:   function() { alert('click'); },
  onMouseover: function() { console.log('hover'); }
}, 'Click me')
```

> Why is this different from `addEventListener`? Because MiniF tracks all handlers internally via a `WeakMap`, enabling automatic cleanup and a consistent API regardless of rendering strategy.

---

### 3. State Management — `MiniF.createStore()`

```js
var store = MiniF.createStore(initialState, reducer);
```

A **reducer** is a pure function: `(currentState, action) → newState`.

```js
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return Object.assign({}, state, { count: state.count + 1 });
    case 'RESET':
      return Object.assign({}, state, { count: 0 });
    default:
      return state;
  }
}

var store = MiniF.createStore({ count: 0 }, reducer);
```

#### `store.getState()`
Returns a shallow copy of the current state.
```js
console.log(store.getState().count); // 0
```

#### `store.dispatch(action)`
Sends an action through the reducer to update state.
```js
store.dispatch({ type: 'INCREMENT' });
console.log(store.getState().count); // 1
```

#### `store.subscribe(fn)`
Register a listener that runs after every state change.  
Returns an unsubscribe function.
```js
var unsubscribe = store.subscribe(function(state) {
  console.log('New state:', state);
});

unsubscribe(); // stop listening
```

---

### 4. Router — `MiniF.createRouter()`

Hash-based routing — syncs the browser URL with app state.

```js
var router = MiniF.createRouter();

router
  .addRoute('/', function() {
    store.dispatch({ type: 'SET_PAGE', page: 'home' });
  })
  .addRoute('/about', function() {
    store.dispatch({ type: 'SET_PAGE', page: 'about' });
  })
  .addRoute('*', function() {
    store.dispatch({ type: 'SET_PAGE', page: '404' });
  })
  .start(); // ← resolve the current URL immediately
```

#### `router.navigate(path)`
Change the URL and trigger the matching route handler.
```js
router.navigate('/about'); // URL becomes: example.com#/about
```

#### `router.current()`
Get the current path.
```js
console.log(router.current()); // '/about'
```

> **Why hash-based?** Hash routing (`#/path`) works with any static file server without any configuration — no server-side rewrites needed.

---

### 5. App — `MiniF.createApp()`

Wires the store, render function, and DOM container together.

```js
MiniF.createApp({
  el: '#app',            // CSS selector or DOM element
  render: myView,        // function(state) → vnode
  store: store,          // optional — passed to render()
  afterRender: function() { // optional — called after each update
    document.querySelector('input')?.focus();
  }
});
```

Your `render` function is a **pure function** — given a state, it returns a virtual DOM tree. MiniF calls it automatically on every state change.

---

## Full Example

A minimal counter app:

```html
<!DOCTYPE html>
<html>
<body>
  <div id="app"></div>
  <script src="framework/core.js"></script>
  <script>
    var h = MiniF.h;

    var store = MiniF.createStore({ count: 0 }, function(state, action) {
      if (action.type === 'INC') return { count: state.count + 1 };
      if (action.type === 'DEC') return { count: state.count - 1 };
      return state;
    });

    function view(state) {
      return h('div', { class: 'counter' },
        h('button', { onClick: function() { store.dispatch({ type: 'DEC' }); } }, '-'),
        h('span', {}, String(state.count)),
        h('button', { onClick: function() { store.dispatch({ type: 'INC' }); } }, '+')
      );
    }

    MiniF.createApp({ el: '#app', render: view, store: store });
  </script>
</body>
</html>
```

---

## Why Things Work the Way They Work

| Concept | Why |
|---------|-----|
| **Virtual DOM** | Your `render()` function returns a plain JS object tree. MiniF turns it into real DOM. When state changes, a fresh tree is generated and the container is updated. This means you describe *what* the UI should look like, never *how* to mutate it. |
| **Unidirectional flow** | State only flows one way: action → reducer → state → view. This makes bugs easy to trace. |
| **Hash routing** | `#/path` changes never trigger a page reload and work on any static server. `hashchange` events let the router intercept changes. |
| **WeakMap for events** | Using a `WeakMap` to store handler references means entries are automatically garbage-collected when their DOM element is removed — no memory leaks. |
| **Inversion of control** | You write `render(state)`, MiniF calls it. You write a `reducer`, MiniF calls it. This is what distinguishes a framework from a library. |

---

## TodoMVC

Located in `todo/`. It demonstrates all four features working together:

- **Virtual DOM** — the entire UI is rendered from a single `view(state)` function
- **State** — todos are stored in a redux-style store with ADD, TOGGLE, DELETE, TOGGLE_ALL, CLEAR actions  
- **Router** — `#/`, `#/active`, `#/completed` filter the visible todos
- **Events** — all user interactions (keydown, click, change) go through the framework's event API
