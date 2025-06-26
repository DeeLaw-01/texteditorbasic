import React, { useState, useEffect, useCallback, useRef } from 'react'
import MockFileServer, { FileVersion } from './MockFileServer'
import './App.css'

// Command pattern for undo/redo operations
type EditCommand = {
  type: 'insert' | 'delete'
  index: number
  text: string
}

const App: React.FC = () => {
  // Core state
  const [text, setText] = useState<string>('')
  const [undoStack, setUndoStack] = useState<EditCommand[]>([])
  const [redoStack, setRedoStack] = useState<EditCommand[]>([])
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [actionMessage, setActionMessage] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(false)

  // Refs to track previous state for diff calculation
  const previousTextRef = useRef<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Constants
  const MAX_HISTORY_SIZE = 1000 // Increased since commands are much smaller

  // Update previous text ref whenever text changes
  useEffect(() => {
    previousTextRef.current = text
  }, [text])

  // Utility function to find the difference between two strings and create commands
  const createEditCommands = (
    oldText: string,
    newText: string
  ): EditCommand[] => {
    if (oldText === newText) return []

    // Find the first position where strings differ
    let startIndex = 0
    while (
      startIndex < oldText.length &&
      startIndex < newText.length &&
      oldText[startIndex] === newText[startIndex]
    ) {
      startIndex++
    }

    // Find the last position where strings differ (working backwards)
    let oldEndIndex = oldText.length
    let newEndIndex = newText.length
    while (
      oldEndIndex > startIndex &&
      newEndIndex > startIndex &&
      oldText[oldEndIndex - 1] === newText[newEndIndex - 1]
    ) {
      oldEndIndex--
      newEndIndex--
    }

    const commands: EditCommand[] = []

    // If text was deleted
    if (oldEndIndex > startIndex) {
      const deletedText = oldText.substring(startIndex, oldEndIndex)
      commands.push({
        type: 'delete',
        index: startIndex,
        text: deletedText
      })
    }

    // If text was inserted
    if (newEndIndex > startIndex) {
      const insertedText = newText.substring(startIndex, newEndIndex)
      commands.push({
        type: 'insert',
        index: startIndex,
        text: insertedText
      })
    }

    return commands
  }

  // Apply a command to text
  const applyCommand = (text: string, command: EditCommand): string => {
    switch (command.type) {
      case 'insert':
        return (
          text.slice(0, command.index) +
          command.text +
          text.slice(command.index)
        )
      case 'delete':
        return (
          text.slice(0, command.index) +
          text.slice(command.index + command.text.length)
        )
      default:
        return text
    }
  }

  // Create inverse command
  const createInverseCommand = (command: EditCommand): EditCommand => {
    switch (command.type) {
      case 'insert':
        return {
          type: 'delete',
          index: command.index,
          text: command.text
        }
      case 'delete':
        return {
          type: 'insert',
          index: command.index,
          text: command.text
        }
      default:
        return command
    }
  }

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Handle text change with command-based tracking
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const oldText = previousTextRef.current

    if (oldText !== newText) {
      // Create commands for the change
      const commands = createEditCommands(oldText, newText)

      if (commands.length > 0) {
        // Add commands to undo stack
        setUndoStack(prev => {
          const newUndoStack = [...prev, ...commands]
          // Limit history size
          if (newUndoStack.length > MAX_HISTORY_SIZE) {
            return newUndoStack.slice(-MAX_HISTORY_SIZE)
          }
          return newUndoStack
        })

        // Clear redo stack when new text is entered
        setRedoStack([])
      }
    }

    setText(newText)
  }

  // Undo function with command pattern
  const performUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const command = undoStack[undoStack.length - 1]
      const inverseCommand = createInverseCommand(command)

      // Apply inverse command
      const newText = applyCommand(text, inverseCommand)

      // Update stacks
      setUndoStack(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, command])

      setText(newText)
      setActionMessage('Undo Performed')

      // Update cursor position if possible
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            inverseCommand.index,
            inverseCommand.index
          )
        }
      }, 0)
    }
  }, [undoStack, text])

  // Redo function with command pattern
  const performRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const command = redoStack[redoStack.length - 1]

      // Apply command
      const newText = applyCommand(text, command)

      // Update stacks
      setRedoStack(prev => prev.slice(0, -1))
      setUndoStack(prev => [...prev, command])

      setText(newText)
      setActionMessage('Redo Performed')

      // Update cursor position if possible
      setTimeout(() => {
        if (textareaRef.current) {
          const cursorPos =
            command.type === 'insert'
              ? command.index + command.text.length
              : command.index
          textareaRef.current.setSelectionRange(cursorPos, cursorPos)
        }
      }, 0)
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

  // Reset function with command pattern
  const resetEditor = () => {
    setText('')
    setUndoStack([])
    setRedoStack([])
    setActionMessage('Editor Reset')
  }

  // Load version back to editor with command tracking
  const loadVersion = (version: FileVersion) => {
    const oldText = text
    const newText = version.content

    if (oldText !== newText) {
      // Create commands for loading the version
      const commands = createEditCommands(oldText, newText)

      if (commands.length > 0) {
        setUndoStack(prev => {
          const newUndoStack = [...prev, ...commands]
          // Limit history size
          if (newUndoStack.length > MAX_HISTORY_SIZE) {
            return newUndoStack.slice(-MAX_HISTORY_SIZE)
          }
          return newUndoStack
        })

        // Clear redo stack when loading a version
        setRedoStack([])
      }
    }

    setText(newText)
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

  // Responsive styles
  const containerStyle = {
    padding: isMobile ? '10px' : '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  }

  const mainLayoutStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : ('row' as 'column' | 'row'),
    gap: isMobile ? '15px' : '20px'
  }

  const editorSectionStyle = {
    flex: isMobile ? 'none' : 1,
    order: isMobile ? 1 : 0
  }

  const buttonContainerStyle = {
    marginBottom: '10px',
    display: 'flex',
    flexWrap: 'wrap' as 'wrap',
    gap: isMobile ? '8px' : '10px'
  }

  const buttonStyle = (disabled: boolean, bgColor: string) => ({
    padding: isMobile ? '10px 12px' : '8px 16px',
    backgroundColor: disabled ? '#ccc' : bgColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: isMobile ? '14px' : '13px',
    minWidth: isMobile ? '80px' : 'auto',
    flex: isMobile ? '1 1 auto' : 'none'
  })

  const textareaStyle = {
    width: '100%',
    height: isMobile ? '300px' : '400px',
    padding: isMobile ? '10px' : '12px',
    fontSize: isMobile ? '16px' : '14px', // Larger font on mobile to prevent zoom
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'monospace',
    resize: 'vertical' as 'vertical',
    boxSizing: 'border-box' as 'border-box'
  }

  const versionHistoryStyle = {
    width: isMobile ? '100%' : '300px',
    order: isMobile ? 0 : 1
  }

  const versionListStyle = {
    maxHeight: isMobile ? '250px' : '500px',
    overflowY: 'auto' as 'auto'
  }

  const actionMessageStyle = {
    position: 'fixed' as 'fixed',
    top: isMobile ? '10px' : '20px',
    right: isMobile ? '10px' : '20px',
    left: isMobile ? '10px' : 'auto',
    background: '#4CAF50',
    color: 'white',
    padding: isMobile ? '8px 12px' : '10px 20px',
    borderRadius: '4px',
    zIndex: 1000,
    fontSize: isMobile ? '14px' : '16px',
    textAlign: 'center' as 'center'
  }

  return (
    <div style={containerStyle}>
      <h1
        style={{
          fontSize: isMobile ? '24px' : '32px',
          textAlign: isMobile ? 'center' : 'left',
          marginBottom: isMobile ? '15px' : '20px'
        }}
      >
        Text Editor with Undo/Redo
      </h1>

      {/* Action Message */}
      {actionMessage && <div style={actionMessageStyle}>{actionMessage}</div>}

      <div style={mainLayoutStyle}>
        {/* Editor Section */}
        <div style={editorSectionStyle}>
          <div style={buttonContainerStyle}>
            <button
              onClick={performUndo}
              disabled={undoStack.length === 0}
              style={buttonStyle(undoStack.length === 0, '#2196F3')}
            >
              {isMobile ? 'Undo' : 'Undo (Ctrl+Z)'}
            </button>
            <button
              onClick={performRedo}
              disabled={redoStack.length === 0}
              style={buttonStyle(redoStack.length === 0, '#2196F3')}
            >
              {isMobile ? 'Redo' : 'Redo (Ctrl+Y)'}
            </button>
            <button onClick={saveVersion} style={buttonStyle(false, '#4CAF50')}>
              Save Version
            </button>
            <button onClick={resetEditor} style={buttonStyle(false, '#f44336')}>
              Reset
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={
              isMobile
                ? 'Start typing...'
                : 'Start typing here... Use Ctrl+Z to undo, Ctrl+Y to redo'
            }
            style={textareaStyle}
          />

          <div
            style={{
              marginTop: '10px',
              fontSize: isMobile ? '11px' : '12px',
              color: '#666',
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            Commands: {undoStack.length} | Redo Stack: {redoStack.length} |
            Characters: {text.length}
          </div>
        </div>

        {/* Version History Section */}
        <div style={versionHistoryStyle}>
          <h3
            style={{
              fontSize: isMobile ? '18px' : '20px',
              textAlign: isMobile ? 'center' : 'left',
              marginBottom: isMobile ? '10px' : '15px'
            }}
          >
            Version History
          </h3>
          {versions.length === 0 ? (
            <p
              style={{
                color: '#666',
                fontStyle: 'italic',
                textAlign: isMobile ? 'center' : 'left',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              No versions saved yet
            </p>
          ) : (
            <div style={versionListStyle}>
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  onClick={() => loadVersion(version)}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: isMobile ? '8px' : '10px',
                    marginBottom: '10px',
                    color: 'black',
                    backgroundColor:
                      index === versions.length - 1 ? '#e8f5e8' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: isMobile ? '14px' : '16px'
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
                      fontSize: isMobile ? '11px' : '12px',
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
                      fontSize: isMobile ? '13px' : '14px',
                      fontFamily: 'monospace',
                      marginBottom: '5px'
                    }}
                  >
                    {getPreviewText(version.content)}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#2196F3',
                      fontStyle: 'italic'
                    }}
                  >
                    {isMobile ? 'Tap to load' : 'Click to load this version'}
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
          padding: isMobile ? '10px' : '15px',
          backgroundColor: '#f5f5f5',
          color: 'black',
          borderRadius: '4px'
        }}
      >
        <h4
          style={{
            fontSize: isMobile ? '16px' : '18px',
            marginBottom: isMobile ? '8px' : '10px'
          }}
        >
          Instructions:
        </h4>
        <ul
          style={{
            margin: '5px 0',
            paddingLeft: isMobile ? '15px' : '20px',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          <li>
            <strong>{isMobile ? 'Undo Button' : 'Ctrl + Z'}</strong> - Undo last
            change
          </li>
          <li>
            <strong>{isMobile ? 'Redo Button' : 'Ctrl + Y'}</strong>
            {!isMobile && ' or Ctrl + Shift + Z'} - Redo last undone change
          </li>
          <li>
            <strong>Save Version</strong> - Save current content to version
            history
          </li>
          <li>
            <strong>{isMobile ? 'Tap' : 'Click'} on any version</strong> - Load
            that version back into the editor
          </li>
          <li>
            <strong>Reset</strong> - Clear editor and history
          </li>
        </ul>
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            fontSize: isMobile ? '12px' : '14px'
          }}
        >
          <strong>📈 Memory-Efficient:</strong> Now using command-based
          undo/redo that tracks only changes, not full text snapshots. Perfect
          for large legal documents!
        </div>
      </div>
    </div>
  )
}

export default App
