'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { PartialBlock } from '@blocknote/core'
import toast from 'react-hot-toast'

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), { ssr: false })

interface PageEditorProps {
  pageId: string
  pageTitle?: string
  pageIcon?: string | null
  initialContent?: PartialBlock[]
  onSave?: (pageId: string, content: PartialBlock[]) => void
  onTitleChange?: (pageId: string, newTitle: string) => void
}

interface PageTitleEditorProps {
  pageId: string
  initialTitle: string
  pageIcon?: string | null
  onTitleChange?: (pageId: string, newTitle: string) => void
}

function PageTitleEditor({ pageId, initialTitle, pageIcon, onTitleChange }: PageTitleEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)

    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
    titleTimeoutRef.current = setTimeout(() => {
      onTitleChange?.(pageId, newTitle)
    }, 800)
  }, [pageId, onTitleChange])

  // Global Ctrl+S Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        // Save title immediately if there's a pending change
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current)
          onTitleChange?.(pageId, title)
        }
        
        // Dispatch a custom event so the BlockEditor can pick it up
        document.dispatchEvent(new CustomEvent('editor-manual-save'))
        
        toast.success('Saved to database', { duration: 2000 })
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [pageId, title, onTitleChange])

  return (
    <div className="pt-20 pb-2 px-4 sm:px-12 md:px-24">
      {pageIcon && (
        <div className="text-5xl mb-3 cursor-pointer hover:opacity-80 transition-opacity">
          {pageIcon}
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full text-[40px] font-bold text-[#1f1f1f] placeholder-[#d4d4d4] outline-none border-none bg-transparent leading-tight"
      />
    </div>
  )
}

export default function PageEditor({ pageId, pageTitle, pageIcon, initialContent, onSave, onTitleChange }: PageEditorProps) {
  const title = pageTitle ?? ''

  return (
    <div className="min-h-full bg-white">
      <PageTitleEditor
        key={`${pageId}:${title}`}
        pageId={pageId}
        initialTitle={title}
        pageIcon={pageIcon}
        onTitleChange={onTitleChange}
      />

      {/* BlockNote editor — full width */}
      <div className="px-2 sm:px-6 md:px-12">
        <BlockEditor
          pageId={pageId}
          initialContent={initialContent}
          onSave={onSave}
        />
      </div>
    </div>
  )
}
