var h = MiniF.h;
var createStore = MiniF.createStore;
var createRouter = MiniF.createRouter;
var createApp = MiniF.createApp;

var uid = 0;

function reducer(state, action) {
  switch (action.type) {

    case 'ADD':
      return Object.assign({}, state, {
        todos: state.todos.concat({ id: uid++, text: action.text, done: false })
      });

    case 'TOGGLE':
      return Object.assign({}, state, {
        todos: state.todos.map(function (t) {
          return t.id === action.id ? Object.assign({}, t, { done: !t.done }) : t;
        })
      });

    case 'DELETE':
      return Object.assign({}, state, {
        todos: state.todos.filter(function (t) { return t.id !== action.id; })
      });

    case 'TOGGLE_ALL': {
      var allDone = state.todos.every(function (t) { return t.done; });
      return Object.assign({}, state, {
        todos: state.todos.map(function (t) { return Object.assign({}, t, { done: !allDone }); })
      });
    }

    case 'CLEAR':
      return Object.assign({}, state, {
        todos: state.todos.filter(function (t) { return !t.done; })
      });

    case 'FILTER':
      return Object.assign({}, state, { filter: action.filter });

    default:
      return state;
  }
}

var store = createStore({ todos: [], filter: 'all' }, reducer);

createRouter()
  .addRoute('/', function () { store.dispatch({ type: 'FILTER', filter: 'all' }); })
  .addRoute('/active', function () { store.dispatch({ type: 'FILTER', filter: 'active' }); })
  .addRoute('/completed', function () { store.dispatch({ type: 'FILTER', filter: 'completed' }); })
  .start();

function view(state) {
  var todos = state.todos;
  var filter = state.filter;

  var visible = filter === 'active'    ? todos.filter(function (t) { return !t.done; })
              : filter === 'completed' ? todos.filter(function (t) { return t.done; })
              : todos;

  var left = todos.filter(function (t) { return !t.done; }).length;
  var allDone = todos.length > 0 && todos.every(function (t) { return t.done; });

  function todoItem(todo) {
    var id = todo.id;
    return h('li', { class: todo.done ? 'completed' : '' },
      h('div', { class: 'view' },
        h('input', {
          class: 'toggle',
          type: 'checkbox',
          checked: todo.done,
          onChange: function () { store.dispatch({ type: 'TOGGLE', id: id }); }
        }),
        h('label', {}, todo.text),
        h('button', {
          class: 'destroy',
          onClick: function () { store.dispatch({ type: 'DELETE', id: id }); }
        })
      )
    );
  }

  function filterLink(name, path) {
    var href = path === '/' ? '#/' : '#' + path;
    var isActive = filter === name;
    return h('li', {},
      h('a', { href: href, class: isActive ? 'selected' : '' },
        name.charAt(0).toUpperCase() + name.slice(1)
      )
    );
  }

  return h('section', { class: 'todoapp' },

    h('header', { class: 'header' },
      h('h1', {}, 'todos'),
      h('input', {
        class: 'new-todo',
        placeholder: 'What needs to be done?',
        autofocus: true,
        onKeydown: function (e) {
          var text = e.target.value.trim();
          if (e.key === 'Enter' && text) {
            store.dispatch({ type: 'ADD', text: text });
            e.target.value = '';
          }
        }
      })
    ),

    todos.length > 0
      ? h('section', { class: 'main' },
          h('input', {
            id: 'toggle-all',
            class: 'toggle-all',
            type: 'checkbox',
            checked: allDone,
            onChange: function () { store.dispatch({ type: 'TOGGLE_ALL' }); }
          }),
          h('label', { for: 'toggle-all' }, 'Mark all as complete'),
          h('ul', { class: 'todo-list' },
            visible.map(todoItem)
          )
        )
      : null,

    todos.length > 0
      ? h('footer', { class: 'footer' },
          h('span', { class: 'todo-count' },
            h('strong', {}, String(left)),
            ' item' + (left !== 1 ? 's' : '') + ' left'
          ),
          h('ul', { class: 'filters' },
            filterLink('all',       '/'),
            filterLink('active',    '/active'),
            filterLink('completed', '/completed')
          ),
          todos.some(function (t) { return t.done; })
            ? h('button', {
                class: 'clear-completed',
                onClick: function () { store.dispatch({ type: 'CLEAR' }); }
              }, 'Clear completed')
            : null
        )
      : null
  );
}

createApp({
  el: '#app',
  render: view,
  store: store,
  afterRender: function () {
    var input = document.querySelector('.new-todo');
    if (input) input.focus();
  }
});
