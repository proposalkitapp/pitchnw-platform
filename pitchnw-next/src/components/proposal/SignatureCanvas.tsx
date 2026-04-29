'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser } from 'lucide-react'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

interface SignatureCanvasProps {
  onSignatureChange: (data: string | null) => void;
  initialData?: string | null;
  height?: number;
  lightMode?: boolean;
}

export function SignatureCanvas({ onSignatureChange, initialData, height = 140, lightMode = false }: SignatureCanvasProps) {
  const [mode, setMode] = useState<"draw" | "type">("draw")
  const [typedName, setTypedName] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const bgColor = lightMode ? "#ffffff" : "#0f172a"
  const strokeColor = lightMode ? "#0f172a" : "#ffffff"

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onSignatureChange(null)
  }, [bgColor, onSignatureChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = height * 2
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(2, 2)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.offsetWidth, height)

    if (initialData && mode === "draw") {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, height)
      }
      img.src = initialData
    }
  }, [mode, height, bgColor, initialData])

  const getPos = (e: any) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : null
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e: any) => {
    isDrawing.current = true
    lastPos.current = getPos(e)
  }

  const draw = (e: any) => {
    if (!isDrawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false
      lastPos.current = null
      const canvas = canvasRef.current
      if (canvas) onSignatureChange(canvas.toDataURL("image/png"))
    }
  }

  const handleTypedChange = (name: string) => {
    setTypedName(name)
    if (!name.trim()) {
      onSignatureChange(null)
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = height * 2
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, 600, height * 2)
    ctx.font = `italic black ${Math.min(48, height)}px serif`
    ctx.fillStyle = strokeColor
    ctx.textBaseline = "middle"
    ctx.fillText(name, 40, height)
    onSignatureChange(canvas.toDataURL("image/png"))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
        <button
          type="button"
          onClick={() => { setMode("draw"); setTypedName(""); }}
          className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", mode === "draw" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => { setMode("type"); clearCanvas(); }}
          className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", mode === "type" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
        >
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <div className="relative group">
          <canvas
            ref={canvasRef}
            className={cn(
              "w-full rounded-3xl border-2 cursor-crosshair touch-none transition-all",
              lightMode ? "border-slate-100 bg-white" : "border-slate-800 bg-slate-900"
            )}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <ClayButton
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 h-10 w-10 p-0 rounded-xl bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={clearCanvas}
          >
            <Eraser className="h-4 w-4" />
          </ClayButton>
        </div>
      ) : (
        <div className="space-y-4">
          <ClayInput
            placeholder="Type your full name"
            value={typedName}
            onChange={(e) => handleTypedChange(e.target.value)}
          />
          {typedName && (
            <div
              className={cn(
                "rounded-3xl border-2 p-8 text-center flex items-center justify-center transition-all animate-in fade-in zoom-in-95",
                lightMode ? "border-slate-100 bg-white" : "border-slate-800 bg-slate-900"
              )}
              style={{ height: `${height}px` }}
            >
              <span className="text-4xl font-serif italic font-black" style={{ color: strokeColor }}>
                {typedName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
