'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useEffect, useRef } from 'react'
import type { PartialBlock } from '@blocknote/core'
import { uploadToS3 } from '@/utils/s3/upload'

interface EditorProps {
  pageId: string
  initialContent?: PartialBlock[]
  onSave?: (pageId: string, content: PartialBlock[]) => void
}

export default function Editor({ pageId, initialContent, onSave }: EditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>(JSON.stringify(initialContent))
  const lastSaveTimeRef = useRef<number>(0)

  const editor = useCreateBlockNote({
    initialContent: initialContent,
    uploadFile: uploadToS3,
  })

  // Advanced Scale-Aware Auto-Save
  useEffect(() => {
    if (!onSave) return

    const handleChange = () => {
      const now = Date.now()
      const timeSinceLastSave = now - lastSaveTimeRef.current
      const MIN_SAVE_INTERVAL = 15000 // At most 1 save per 15 seconds
      const DEBOUNCE_DELAY = 5000     // 5 second silence before saving

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      const performSave = () => {
        const blocks = editor.document
        const contentString = JSON.stringify(blocks)

        // 1. Dirty Checking: Only save if content actually changed
        if (contentString === lastSavedContentRef.current) return

        // 2. Perform the save
        onSave(pageId, blocks)
        
        // 3. Update trackers
        lastSavedContentRef.current = contentString
        lastSaveTimeRef.current = Date.now()
      }

      // If they haven't saved in a long time (15s), and they pause for a bit, save.
      // Otherwise, keep resetting the 5s debounce.
      const waitTime = Math.max(DEBOUNCE_DELAY, MIN_SAVE_INTERVAL - timeSinceLastSave)

      saveTimeoutRef.current = setTimeout(performSave, waitTime)
    }

    editor.onChange(handleChange)

    const handleManualSave = () => {
      // Force save regardless of time
      const blocks = editor.document
      const contentString = JSON.stringify(blocks)
      onSave(pageId, blocks)
      lastSavedContentRef.current = contentString
      lastSaveTimeRef.current = Date.now()
    }

    document.addEventListener('editor-manual-save', handleManualSave)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      document.removeEventListener('editor-manual-save', handleManualSave)
    }
  }, [editor, pageId, onSave])

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="bn-editor-clean"
      />
    </div>
  )
}
