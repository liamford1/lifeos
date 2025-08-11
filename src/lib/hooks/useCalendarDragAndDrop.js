'use client'
import { useRef, useState, useCallback } from 'react'

export function useCalendarDragAndDrop({ onDrop }) {
  const draggingRef = useRef(null) // { id, startX, startY, started, originalStart, originalEnd }
  const [draggingId, setDraggingId] = useState(null)

  const startDrag = useCallback((evt, { id, originalStart, originalEnd }) => {
    // Prevent scroll hijack; only begin if pointer moved > threshold (5px)
    const { clientX, clientY } = evt;
    draggingRef.current = { 
      id, 
      startX: clientX, 
      startY: clientY, 
      started: false,
      originalStart,
      originalEnd
    }
    setDraggingId(id)
  }, [])

  const moveDrag = useCallback((evt) => {
    const d = draggingRef.current
    if (!d) return
    
    const { startX, startY } = d;
    const { clientX, clientY } = evt;
    const dx = Math.abs(clientX - startX)
    const dy = Math.abs(clientY - startY)
    
    if (!d.started && dx + dy < 5) return
    d.started = true
    
    // We won't visually move the real event; we'll calculate target day beneath pointer.
    // The visual feedback will be handled by the calendar component
  }, [])

  const endDrag = useCallback((evt, { computeTargetDate }) => {
    const d = draggingRef.current
    if (!d || !d.started) {
      draggingRef.current = null
      setDraggingId(null)
      return
    }
    
    const { id } = d
    draggingRef.current = null
    setDraggingId(null)
    
    const targetISO = computeTargetDate?.(evt) // returns ISO day start, or existing time combined with new day
    if (!targetISO) return
    
    onDrop?.({ 
      id, 
      newStartISO: targetISO,
      originalStart: d.originalStart,
      originalEnd: d.originalEnd
    })
  }, [onDrop])

  return { 
    draggingId, 
    startDrag, 
    moveDrag, 
    endDrag,
    isDragging: !!draggingId
  }
} 