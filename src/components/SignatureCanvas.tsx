import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (data: string | null) => void;
  initialData?: string | null;
  height?: number;
  lightMode?: boolean;
}

export function SignatureCanvas({ onSignatureChange, initialData, height = 120, lightMode = false }: SignatureCanvasProps) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const bgColor = lightMode ? "#ffffff" : "#0a0a0f";
  const strokeColor = lightMode ? "#1a1a2e" : "#f8f8ff";

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null);
  }, [bgColor, onSignatureChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = height * 2;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.offsetWidth, height);

    if (initialData && mode === "draw") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, height);
      };
      img.src = initialData;
    }
  }, [mode, height, bgColor, initialData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] || (e as any).changedTouches[0] : null;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      const canvas = canvasRef.current;
      if (canvas) onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const handleTypedChange = (name: string) => {
    setTypedName(name);
    if (!name.trim()) {
      onSignatureChange(null);
      return;
    }
    // Render typed signature to canvas for consistent storage
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 600, height * 2);
    ctx.font = `${Math.min(48, height)}px 'Dancing Script', cursive`;
    ctx.fillStyle = strokeColor;
    ctx.textBaseline = "middle";
    ctx.fillText(name, 20, height);
    onSignatureChange(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("draw"); setTypedName(""); }}
        >
          Draw
        </Button>
        <Button
          type="button"
          variant={mode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("type"); clearCanvas(); }}
        >
          Type
        </Button>
      </div>

      {mode === "draw" ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`w-full rounded-lg border cursor-crosshair touch-none ${
              lightMode ? "border-gray-300 bg-white" : "border-border bg-background"
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearCanvas}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Input
            placeholder="Type your name"
            value={typedName}
            onChange={(e) => handleTypedChange(e.target.value)}
            className={lightMode ? "border-gray-300" : ""}
          />
          {typedName && (
            <div
              className={`mt-3 rounded-lg border p-4 text-center ${
                lightMode ? "border-gray-300 bg-white" : "border-border bg-background"
              }`}
              style={{ height: `${height}px`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <span className="font-signature text-3xl" style={{ color: strokeColor === "#f8f8ff" ? "hsl(var(--foreground))" : strokeColor }}>
                {typedName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
