import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_TODO_API_URL

if (!API_BASE_URL) {
  throw new Error('VITE_TODO_API_URL 환경변수를 설정해주세요.')
}

const request = async (path = '', options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? '요청 처리 중 문제가 발생했습니다.')
  }

  return data
}

function App() {
  const [todos, setTodos] = useState([])
  const [task, setTask] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTask, setEditingTask] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const activeTodosCount = useMemo(() => todos.length, [todos])

  const fetchTodos = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await request()
      setTodos(data.todos ?? [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleCreateTodo = async (event) => {
    event.preventDefault()

    const nextTask = task.trim()
    if (!nextTask) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      const data = await request('', {
        method: 'POST',
        body: JSON.stringify({ task: nextTask }),
      })

      setTodos((currentTodos) => [data.todo, ...currentTodos])
      setTask('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (todo) => {
    setEditingId(todo._id)
    setEditingTask(todo.task)
    setErrorMessage('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTask('')
  }

  const handleUpdateTodo = async (id) => {
    const nextTask = editingTask.trim()
    if (!nextTask) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      const data = await request(`/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ task: nextTask }),
      })

      setTodos((currentTodos) =>
        currentTodos.map((todo) => (todo._id === id ? data.todo : todo)),
      )
      cancelEditing()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTodo = async (id) => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      await request(`/${id}`, { method: 'DELETE' })
      setTodos((currentTodos) => currentTodos.filter((todo) => todo._id !== id))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Localhost Todo Desk</p>
          <h1 id="app-title">오늘 할 일을 정리하세요</h1>
          <p className="hero-copy">
            꾸준함은 작은 하루를 모아 결국 큰 변화를 만듭니다.
          </p>
        </div>
        <div className="todo-count" aria-label={`총 ${activeTodosCount}개 할 일`}>
          <span>{activeTodosCount}</span>
          <small>tasks</small>
        </div>
      </section>

      <section className="todo-panel" aria-label="할 일 관리">
        <form className="todo-form" onSubmit={handleCreateTodo}>
          <label htmlFor="task">새 할 일</label>
          <div className="input-row">
            <input
              id="task"
              type="text"
              value={task}
              placeholder="예: 백엔드 API 연결 확인하기"
              onChange={(event) => setTask(event.target.value)}
            />
            <button type="submit" disabled={isSaving || !task.trim()}>
              추가
            </button>
          </div>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="list-header">
          <h2>할 일 목록</h2>
          <button type="button" className="ghost-button" onClick={fetchTodos}>
            새로고침
          </button>
        </div>

        {isLoading ? (
          <p className="empty-state">목록을 불러오는 중입니다...</p>
        ) : todos.length === 0 ? (
          <p className="empty-state">아직 등록된 할 일이 없습니다.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li className="todo-item" key={todo._id}>
                {editingId === todo._id ? (
                  <div className="edit-row">
                    <input
                      type="text"
                      value={editingTask}
                      aria-label="할 일 수정"
                      onChange={(event) => setEditingTask(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleUpdateTodo(todo._id)
                        if (event.key === 'Escape') cancelEditing()
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateTodo(todo._id)}
                      disabled={isSaving || !editingTask.trim()}
                    >
                      저장
                    </button>
                    <button type="button" className="muted-button" onClick={cancelEditing}>
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="todo-content">
                      <span>{todo.task}</span>
                      {todo.createdAt && (
                        <time dateTime={todo.createdAt}>
                          {new Intl.DateTimeFormat('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(todo.createdAt))}
                        </time>
                      )}
                    </div>
                    <div className="actions">
                      <button type="button" onClick={() => startEditing(todo)}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteTodo(todo._id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
