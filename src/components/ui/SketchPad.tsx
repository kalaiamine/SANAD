'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';

interface SketchPadProps {
    /** Called with a PNG data URL every time the drawing changes (debounced to pointer-up). */
    onChange: (dataUrl: string) => void;
    width?: number;
    height?: number;
}

/**
 * Minimal freehand canvas standing in for the "croquis de l'accident" box
 * on the real constat form — lets the user sketch the position of both
 * vehicles at the moment of impact with a finger/mouse/stylus.
 */
export default function SketchPad({ onChange, width = 700, height = 220 }: SketchPadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const historyRef = useRef<ImageData[]>([]);
    const [hasDrawing, setHasDrawing] = useState(false);

    const getCtx = () => canvasRef.current?.getContext('2d') || null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1F6F78';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const pushHistory = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (historyRef.current.length > 20) historyRef.current.shift();
    };

    const emitChange = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onChange(canvas.toDataURL('image/png'));
    };

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * canvas.width,
            y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const ctx = getCtx();
        if (!ctx) return;
        pushHistory();
        drawingRef.current = true;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setHasDrawing(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const ctx = getCtx();
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handlePointerUp = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        emitChange();
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        pushHistory();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
        emitChange();
    };

    const handleUndo = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        const last = historyRef.current.pop();
        if (last) {
            ctx.putImageData(last, 0, 0);
            emitChange();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                    Croquis de l&apos;accident — dessinez la position des véhicules au moment du choc
                </span>
                <div className="flex gap-1">
                    <button type="button" onClick={handleUndo} className="btn-ghost p-1.5" title="Annuler le dernier trait">
                        <Undo2 size={14} />
                    </button>
                    <button type="button" onClick={handleClear} className="btn-ghost p-1.5" title="Effacer le croquis">
                        <Eraser size={14} />
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full rounded-xl border border-border bg-white touch-none cursor-crosshair"
                style={{ aspectRatio: `${width} / ${height}` }}
            />
            {!hasDrawing && <p className="text-[10px] text-muted-foreground">Astuce : tracez les routes, puis chaque véhicule (A et B) avec une flèche indiquant sa direction.</p>}
        </div>
    );
}
