'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
    label: string;
    value: string;
    onChange: (dataUrl: string) => void;
    accentClass?: string;
}

/** Compact canvas for driver signatures on the constat amiable. */
export default function SignaturePad({ label, value, onChange, accentClass = 'border-border' }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const [hasInk, setHasInk] = useState(Boolean(value));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a2e5c';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasInk(true);
            };
            img.src = value;
        }
    }, [value]);

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * canvas.width,
            y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const emit = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onChange(canvas.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasInk(false);
        onChange('');
    };

    return (
        <div className={`rounded-xl border ${accentClass} bg-white p-2 space-y-1.5`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                {hasInk && (
                    <button type="button" onClick={clear} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Eraser size={11} /> Effacer
                    </button>
                )}
            </div>
            <canvas
                ref={canvasRef}
                width={320}
                height={88}
                className="w-full h-[88px] rounded-lg border border-dashed border-border touch-none cursor-crosshair bg-white"
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const ctx = canvasRef.current?.getContext('2d');
                    if (!ctx) return;
                    drawingRef.current = true;
                    const { x, y } = getPos(e);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    setHasInk(true);
                }}
                onPointerMove={(e) => {
                    if (!drawingRef.current) return;
                    const ctx = canvasRef.current?.getContext('2d');
                    if (!ctx) return;
                    const { x, y } = getPos(e);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }}
                onPointerUp={() => {
                    drawingRef.current = false;
                    emit();
                }}
                onPointerLeave={() => {
                    if (drawingRef.current) {
                        drawingRef.current = false;
                        emit();
                    }
                }}
            />
            <p className="text-[10px] text-muted-foreground">Signez avec la souris ou le doigt</p>
        </div>
    );
}
