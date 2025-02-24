import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import './App.css'

interface TodoItem {
  id: string;
  text: string;
  details?: {
    id: string;
    text: string;
    isList: boolean;
    completed: boolean;
  }[];
  completed: boolean;
  date: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark-mode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showModal, setShowModal] = useState(false);

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('todo-app-state');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('todo-app-state', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('new-todo-input')?.focus();
      }
    };
    
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const processText = (text: string): { mainText: string; details: { id: string; text: string; isList: boolean; completed: boolean }[] } => {
    const lines = text.split('\n');
    const mainText = lines[0];
    const details = lines.slice(1)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: line.startsWith('* ') ? line.substring(2) : line,
        isList: line.startsWith('* '),
        completed: false
      }));
    
    return { mainText, details };
  };

  const addTodo = useCallback(() => {
    if (newTodo.trim()) {
      const { mainText, details } = processText(newTodo);
      const newTodoItem: TodoItem = {
        id: Date.now().toString(),
        text: mainText,
        details: details.length > 0 ? details : undefined,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd HH:mm')
      };

      setTodos((prevTodos: TodoItem[]) => {
        const updatedTodos = [...prevTodos, newTodoItem];
        return sortTodos(updatedTodos);
      });
      setNewTodo('');
    }
  }, [newTodo]);

  const sortTodos = (todos: TodoItem[]) => {
    return todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  const toggleTodo = (id: string) => {
    setTodos((prevTodos: TodoItem[]) => {
      const updatedTodos = prevTodos.map((todo: TodoItem) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      return sortTodos(updatedTodos);
    });
  };

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prevTodos: TodoItem[]) => {
      return prevTodos.map((todo: TodoItem) => {
        if (todo.id === todoId && todo.details) {
          return {
            ...todo,
            details: todo.details.map(detail => 
              detail.id === subtaskId ? { ...detail, completed: !detail.completed } : detail
            )
          };
        }
        return todo;
      });
    });
  };

  const deleteTodo = (id: string) => {
    setTodos((prevTodos: TodoItem[]) => prevTodos.filter((todo: TodoItem) => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTodo();
    }
  };

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>Todo App</h1>
        <div className="header-buttons">
          <button
            onClick={() => setShowModal(true)}
            className="info-button"
            title="Show app features"
          >
            ℹ️
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="input-container">
        <textarea
          id="new-todo-input"
          className="todo-input"
          placeholder="Add new task (Enter to add, Shift+Enter for new line)&#10;* Use asterisk for list items"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button className="add-button" onClick={addTodo}>
          <span>+</span> Add Todo
        </button>
      </div>

      <div className="todos-list">
        {todos.map(todo => (
          <div key={todo.id} 
               className={`todo-item ${todo.completed ? 'todo-completed' : ''}`}
               onClick={(e) => {
                 // Prevent toggling if clicking delete button
                 if (!(e.target as HTMLElement).closest('.todo-delete')) {
                   toggleTodo(todo.id);
                 }
               }}
               style={{ cursor: 'pointer' }}
          >
            <div className="todo-item-content">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleTodo(todo.id);
                }}
                className="todo-checkbox"
                onClick={(e) => e.stopPropagation()} // Prevent double-toggle when clicking checkbox
              />
              <div className="todo-content">
                <p className="todo-text">{todo.text}</p>
                {todo.details && todo.details.length > 0 && (
                  <div className="todo-details">
                    {todo.details.map((detail) => 
                      detail.isList ? (
                        <div 
                          key={detail.id} 
                          className="todo-subtask"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent todo from being toggled
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={detail.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSubtask(todo.id, detail.id);
                            }}
                            className="todo-checkbox subtask-checkbox"
                            onClick={(e) => e.stopPropagation()} // Prevent double-toggle
                          />
                          <span 
                            className={`subtask-text ${detail.completed ? 'completed' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtask(todo.id, detail.id);
                            }}
                          >
                            {detail.text}
                          </span>
                        </div>
                      ) : (
                        <p key={detail.id} className="todo-detail-text">{detail.text}</p>
                      )
                    )}
                  </div>
                )}
                <div className="todo-date">{format(parseISO(todo.date), 'MMM dd, yyyy HH:mm')}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTodo(todo.id);
              }}
              className="todo-delete"
              title="Delete todo"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h2>Features Guide</h2>
            
            <section className="feature-section">
              <h3>Creating Todos</h3>
              <ul>
                <li>Press <kbd>Cmd/Ctrl + K</kbd> anywhere to quickly focus the input</li>
                <li>Press <kbd>Enter</kbd> to add a todo</li>
                <li>Use <kbd>Shift + Enter</kbd> for new lines</li>
              </ul>
            </section>

            <section className="feature-section">
              <h3>Adding Lists to Todos</h3>
              <p>Start a line with * to create a list item:</p>
              <pre>
{`Buy groceries
* Milk
* Bread
* Eggs
Remember to use coupons`}
              </pre>
            </section>

            <section className="feature-section">
              <h3>Managing Todos</h3>
              <ul>
                <li>Click anywhere on a todo card to mark it complete</li>
                <li>Click individual checkboxes for main todo or subtasks</li>
                <li>Click the trash icon to delete a todo</li>
                <li>Completed todos are automatically moved to the bottom</li>
              </ul>
            </section>

            <section className="feature-section">
              <h3>Additional Features</h3>
              <ul>
                <li>Dark/Light mode toggle</li>
                <li>All todos are saved automatically</li>
                <li>Subtasks can be completed independently</li>
                <li>Creation time is shown for each todo</li>
              </ul>
            </section>
          </div>
        </div>
      )}
      
      <button
        className="floating-button"
        onClick={() => document.getElementById('new-todo-input')?.focus()}
        title="Add new todo (Ctrl/Cmd + K)"
      >
        +
      </button>
    </div>
  );
}

export default App;
