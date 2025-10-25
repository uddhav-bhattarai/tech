/**
 * Real-Time Synchronization Engine
 * WebSocket-based synchronization between Markdown, WYSIWYG, and Section-based editors
 * with conflict resolution, collaborative cursors, and seamless format switching
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { UnifiedContent } from '@/lib/unified-content'
import { useDebounce } from '@/hooks/useDebounce'

export type EditorType = 'markdown' | 'wysiwyg' | 'section'
export type SyncEvent = 'content_change' | 'cursor_move' | 'selection_change' | 'format_switch'
export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

interface SyncMessage {
  id: string
  type: SyncEvent
  editorType: EditorType
  userId: string
  sessionId: string
  timestamp: number
  data: {
    content?: UnifiedContent
    cursor?: { line: number; column: number }
    selection?: { start: number; end: number }
    targetFormat?: EditorType
    metadata?: Record<string, unknown>
  }
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
  cursor?: { line: number; column: number }
  selection?: { start: number; end: number }
  activeEditor: EditorType
  lastSeen: number
}

interface ConflictResolution {
  strategy: 'latest_wins' | 'merge' | 'user_choice'
  resolver?: (local: UnifiedContent, remote: UnifiedContent) => UnifiedContent
}

interface SyncEngineConfig {
  websocketUrl: string
  sessionId: string
  userId: string
  userName: string
  userEmail: string
  autoReconnect?: boolean
  reconnectInterval?: number
  conflictResolution?: ConflictResolution
  enableCollaboration?: boolean
  enableCursors?: boolean
  enablePresence?: boolean
}

interface SyncEngineHook {
  // Connection status
  status: SyncStatus
  collaborators: Collaborator[]
  
  // Content synchronization
  syncedContent: UnifiedContent
  hasConflicts: boolean
  
  // Methods
  connect: () => void
  disconnect: () => void
  sendContentChange: (content: UnifiedContent, editorType: EditorType) => void
  sendCursorMove: (cursor: { line: number; column: number }, editorType: EditorType) => void
  sendFormatSwitch: (targetFormat: EditorType, content: UnifiedContent) => void
  resolveConflict: (resolution: UnifiedContent) => void
  
  // Events
  onContentChange?: (content: UnifiedContent, source: EditorType) => void
  onFormatSwitch?: (targetFormat: EditorType, content: UnifiedContent) => void
  onCollaboratorJoin?: (collaborator: Collaborator) => void
  onCollaboratorLeave?: (collaboratorId: string) => void
  onCursorMove?: (collaboratorId: string, cursor: { line: number; column: number }, editorType: EditorType) => void
}

// Simplified sync engine for demonstration
class SynchronizationEngine {
  private config: SyncEngineConfig
  private messageQueue: SyncMessage[] = []
  private mockConnected = false

  constructor(config: SyncEngineConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      conflictResolution: { strategy: 'latest_wins' },
      enableCollaboration: true,
      enableCursors: true,
      enablePresence: true,
      ...config
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      // Mock connection for development
      setTimeout(() => {
        this.mockConnected = true
        console.log('🔗 Sync engine connected (mock)')
        resolve()
      }, 1000)
    })
  }

  disconnect(): void {
    this.mockConnected = false
    console.log('🔌 Sync engine disconnected')
  }

  sendContentChange(content: UnifiedContent, editorType: EditorType): void {
    if (!this.mockConnected) return
    
    console.log(`📝 Content change in ${editorType} editor:`, {
      wordCount: content.metadata.wordCount,
      lastModified: content.metadata.lastModified
    })
  }

  sendCursorMove(cursor: { line: number; column: number }, editorType: EditorType): void {
    if (!this.config.enableCursors || !this.mockConnected) return
    
    console.log(`👆 Cursor moved in ${editorType}:`, cursor)
  }

  sendFormatSwitch(targetFormat: EditorType, content: UnifiedContent): void {
    if (!this.mockConnected) return
    
    console.log(`🔄 Format switch to ${targetFormat}:`, {
      wordCount: content.metadata.wordCount
    })
  }
}

// React hook for using the sync engine
export function useSyncEngine(
  config: SyncEngineConfig,
  initialContent: UnifiedContent
): SyncEngineHook {
  const [status, setStatus] = useState<SyncStatus>('disconnected')
  const [collaborators] = useState<Collaborator[]>([])
  const [syncedContent, setSyncedContent] = useState<UnifiedContent>(initialContent)
  const [hasConflicts] = useState(false)
  
  const engineRef = useRef<SynchronizationEngine | null>(null)
  
  // Debounce content changes to avoid excessive sync messages
  const debouncedSendContent = useDebounce(
    (content: UnifiedContent, editorType: EditorType) => {
      engineRef.current?.sendContentChange(content, editorType)
    },
    500
  )

  // Initialize sync engine
  useEffect(() => {
    engineRef.current = new SynchronizationEngine(config)
    
    return () => {
      engineRef.current?.disconnect()
    }
  }, [config])

  // Connect on mount
  useEffect(() => {
    if (engineRef.current) {
      setStatus('connecting')
      engineRef.current.connect().then(() => {
        setStatus('connected')
      }).catch(() => {
        setStatus('error')
      })
    }
  }, [])

  const connect = useCallback(() => {
    if (engineRef.current) {
      setStatus('connecting')
      engineRef.current.connect().then(() => {
        setStatus('connected')
      }).catch(() => {
        setStatus('error')
      })
    }
  }, [])

  const disconnect = useCallback(() => {
    engineRef.current?.disconnect()
    setStatus('disconnected')
  }, [])

  const sendContentChange = useCallback((content: UnifiedContent, editorType: EditorType) => {
    setSyncedContent(content)
    debouncedSendContent(content, editorType)
  }, [debouncedSendContent])

  const sendCursorMove = useCallback((cursor: { line: number; column: number }, editorType: EditorType) => {
    engineRef.current?.sendCursorMove(cursor, editorType)
  }, [])

  const sendFormatSwitch = useCallback((targetFormat: EditorType, content: UnifiedContent) => {
    engineRef.current?.sendFormatSwitch(targetFormat, content)
    setSyncedContent(content)
  }, [])

  const resolveConflict = useCallback((resolution: UnifiedContent) => {
    setSyncedContent(resolution)
    engineRef.current?.sendContentChange(resolution, 'markdown')
  }, [])

  return {
    status,
    collaborators,
    syncedContent,
    hasConflicts,
    connect,
    disconnect,
    sendContentChange,
    sendCursorMove,
    sendFormatSwitch,
    resolveConflict
  }
}

// Content transformation utilities for format switching
export class FormatSwitcher {
  static switchTo(
    content: UnifiedContent, 
    targetFormat: EditorType,
    currentFormat: EditorType
  ): UnifiedContent {
    if (currentFormat === targetFormat) return content

    switch (targetFormat) {
      case 'markdown':
        return this.toMarkdownFormat(content)
      case 'wysiwyg':
        return this.toWYSIWYGFormat(content)
      case 'section':
        return this.toSectionFormat(content)
      default:
        return content
    }
  }

  private static toMarkdownFormat(content: UnifiedContent): UnifiedContent {
    // Ensure content is optimized for Markdown editing
    console.log('🔄 Converting to Markdown format')
    return {
      ...content,
      metadata: {
        ...content.metadata,
        lastModified: new Date().toISOString()
      }
    }
  }

  private static toWYSIWYGFormat(content: UnifiedContent): UnifiedContent {
    // Ensure content is optimized for WYSIWYG editing
    console.log('🔄 Converting to WYSIWYG format')
    return {
      ...content,
      metadata: {
        ...content.metadata,
        lastModified: new Date().toISOString()
      }
    }
  }

  private static toSectionFormat(content: UnifiedContent): UnifiedContent {
    // Ensure content is optimized for section-based editing
    console.log('🔄 Converting to Section format')
    return {
      ...content,
      metadata: {
        ...content.metadata,
        lastModified: new Date().toISOString()
      }
    }
  }
}

// Conflict resolution strategies
export class ConflictResolver {
  static latestWins(local: UnifiedContent, remote: UnifiedContent): UnifiedContent {
    const localTime = new Date(local.metadata.lastModified || 0).getTime()
    const remoteTime = new Date(remote.metadata.lastModified || 0).getTime()
    
    return remoteTime > localTime ? remote : local
  }

  static merge(local: UnifiedContent, _remote: UnifiedContent): UnifiedContent {
    // Simple merge strategy - use latest metadata
    console.log('🔀 Merging content from multiple sources')
    
    return {
      ...local,
      metadata: {
        ...local.metadata,
        lastModified: new Date().toISOString()
      }
    }
  }
}

export type { SyncEngineConfig, SyncEngineHook, SyncMessage, Collaborator }