import React, { useState, useEffect, useCallback } from 'react'
import MockFileServer, { FileVersion } from './MockFileServer'
import './App.css'

const App: React.FC = () => {
  // Core state
  const [text, setText] = useState<string>('')
  const [history, setHistory] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [actionMessage, setActionMessage] = useState<string>('')

  // Constants
  const MAX_HISTORY_SIZE = 100

  // Load versions on mount
  useEffect(() => {
    setVersions(MockFileServer.getVersions())
  }, [])

  // Clear action message after 1.5 seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage('')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [actionMessage])

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value

    // Add current text to history before changing
    if (text !== newText) {
      setHistory(prev => {
        const newHistory = [...prev, text]
        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          return newHistory.slice(-MAX_HISTORY_SIZE)
        }
        return newHistory
      })

      // Clear redo stack when new text is entered
      setRedoStack([])
    }

    setText(newText)
  }

  // Undo function
  const performUndo = useCallback(() => {
    if (history.length > 0) {
      const previousText = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, text])
      setText(previousText)
      setActionMessage('Undo Performed')
    }
  }, [history, text])

  // Redo function
  const performRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextText = redoStack[redoStack.length - 1]
      setRedoStack(prev => prev.slice(0, -1))
      setHistory(prev => [...prev, text])
      setText(nextText)
      setActionMessage('Redo Performed')
    }
  }, [redoStack, text])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          performUndo()
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          performRedo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [performUndo, performRedo])

  // Save version
  const saveVersion = () => {
    MockFileServer.saveVersion(text)
    setVersions(MockFileServer.getVersions())
    setActionMessage('Version Saved')
  }

  // Reset function (bonus feature)
  const resetEditor = () => {
    setText('')
    setHistory([])
    setRedoStack([])
    setActionMessage('Editor Reset')
  }

  // Load version back to editor
  const loadVersion = (version: FileVersion) => {
    // Add current text to history before loading version
    if (text !== version.content) {
      setHistory(prev => {
        const newHistory = [...prev, text]
        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          return newHistory.slice(-MAX_HISTORY_SIZE)
        }
        return newHistory
      })

      // Clear redo stack when loading a version
      setRedoStack([])
    }

    setText(version.content)
    setActionMessage(`Version ${version.id} Loaded`)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get preview text (first 20 characters)
  const getPreviewText = (content: string) => {
    return content.length > 20 ? content.substring(0, 20) + '...' : content
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Text Editor with Undo/Redo</h1>

      {/* Action Message */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            zIndex: 1000
          }}
        >
          {actionMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Editor Section */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={performUndo}
              disabled={history.length === 0}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                backgroundColor: history.length === 0 ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: history.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Undo (Ctrl+Z)
            </button>
            <button
              onClick={performRedo}
              disabled={redoStack.length === 0}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                backgroundColor: redoStack.length === 0 ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Redo (Ctrl+Y)
            </button>
            <button
              onClick={saveVersion}
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Version
            </button>
            <button
              onClick={resetEditor}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder='Start typing here... Use Ctrl+Z to undo, Ctrl+Y to redo'
            style={{
              width: '100%',
              height: '400px',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            History: {history.length} | Redo Stack: {redoStack.length} |
            Characters: {text.length}
          </div>
        </div>

        {/* Version History Section */}
        <div style={{ width: '300px' }}>
          <h3>Version History</h3>
          {versions.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No versions saved yet
            </p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  onClick={() => loadVersion(version)}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '10px',
                    color: 'black',
                    backgroundColor:
                      index === versions.length - 1 ? '#e8f5e8' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (index !== versions.length - 1) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0'
                    }
                    e.currentTarget.style.borderColor = '#2196F3'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      index === versions.length - 1 ? '#e8f5e8' : 'white'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '5px'
                    }}
                  >
                    Version {version.id} - {formatTimestamp(version.timestamp)}
                    {index === versions.length - 1 && (
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        {' '}
                        (Latest)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      marginBottom: '5px'
                    }}
                  >
                    {getPreviewText(version.content)}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#2196F3',
                      fontStyle: 'italic'
                    }}
                  >
                    Click to load this version
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          color: 'black',
          borderRadius: '4px'
        }}
      >
        <h4>Instructions:</h4>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>
            <strong>Ctrl + Z</strong> - Undo last change
          </li>
          <li>
            <strong>Ctrl + Y</strong> or <strong>Ctrl + Shift + Z</strong> -
            Redo last undone change
          </li>
          <li>
            <strong>Save Version</strong> - Save current content to version
            history
          </li>
          <li>
            <strong>Click on any version</strong> - Load that version back into
            the editor
          </li>
          <li>
            <strong>Reset</strong> - Clear editor and history
          </li>
        </ul>
      </div>
    </div>
  )
}

export default App
