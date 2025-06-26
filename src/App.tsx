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

  return (
    <div className={`app-container ${isMobile ? 'mobile' : ''}`}>
      <h1 className={`app-title ${isMobile ? 'mobile' : ''}`}>
        Text Editor with Undo/Redo
      </h1>

      {/* Action Message */}
      {actionMessage && (
        <div className={`action-message ${isMobile ? 'mobile' : ''}`}>
          {actionMessage}
        </div>
      )}

      <div className={`main-layout ${isMobile ? 'mobile' : ''}`}>
        {/* Editor Section */}
        <div className={`editor-section ${isMobile ? 'mobile' : ''}`}>
          <div className={`button-container ${isMobile ? 'mobile' : ''}`}>
            <button
              onClick={performUndo}
              disabled={undoStack.length === 0}
              className={`btn btn-primary ${isMobile ? 'mobile' : ''}`}
            >
              {isMobile ? 'Undo' : 'Undo (Ctrl+Z)'}
            </button>
            <button
              onClick={performRedo}
              disabled={redoStack.length === 0}
              className={`btn btn-primary ${isMobile ? 'mobile' : ''}`}
            >
              {isMobile ? 'Redo' : 'Redo (Ctrl+Y)'}
            </button>
            <button
              onClick={saveVersion}
              className={`btn btn-success ${isMobile ? 'mobile' : ''}`}
            >
              Save Version
            </button>
            <button
              onClick={resetEditor}
              className={`btn btn-danger ${isMobile ? 'mobile' : ''}`}
            >
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
            className={`textarea ${isMobile ? 'mobile' : ''}`}
          />

          <div className={`stats-display ${isMobile ? 'mobile' : ''}`}>
            Commands: {undoStack.length} | Redo Stack: {redoStack.length} |
            Characters: {text.length}
          </div>
        </div>

        {/* Version History Section */}
        <div className={`version-history ${isMobile ? 'mobile' : ''}`}>
          <h3 className={isMobile ? 'mobile' : ''}>Version History</h3>
          {versions.length === 0 ? (
            <p className={`empty-state ${isMobile ? 'mobile' : ''}`}>
              No versions saved yet
            </p>
          ) : (
            <div className={`version-list ${isMobile ? 'mobile' : ''}`}>
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  onClick={() => loadVersion(version)}
                  className={`version-item ${isMobile ? 'mobile' : ''} ${
                    index === versions.length - 1 ? 'latest' : ''
                  }`}
                >
                  <div className={`version-meta ${isMobile ? 'mobile' : ''}`}>
                    Version {version.id} - {formatTimestamp(version.timestamp)}
                    {index === versions.length - 1 && (
                      <span className='latest-badge'> (Latest)</span>
                    )}
                  </div>
                  <div
                    className={`version-preview ${isMobile ? 'mobile' : ''}`}
                  >
                    {getPreviewText(version.content)}
                  </div>
                  <div className={`version-action ${isMobile ? 'mobile' : ''}`}>
                    {isMobile ? 'Tap to load' : 'Click to load this version'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className={`instructions ${isMobile ? 'mobile' : ''}`}>
        <h4 className={isMobile ? 'mobile' : ''}>Instructions:</h4>
        <ul className={isMobile ? 'mobile' : ''}>
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
        <div className={`memory-info ${isMobile ? 'mobile' : ''}`}>
          <strong>📈 Memory-Efficient:</strong> Now using command-based
          undo/redo that tracks only changes, not full text snapshots. Perfect
          for large legal documents!
        </div>
      </div>
    </div>
  )
}

export default App
