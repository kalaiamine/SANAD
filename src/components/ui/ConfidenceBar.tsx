import React from 'react';

interface ConfidenceBarProps {
    value: number; // 0-100
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export default function ConfidenceBar({ value, showLabel = true, size = 'md' }: ConfidenceBarProps) {
    const color =
        value >= 80 ? 'var(--severity-low)' :
            value >= 60 ? 'var(--severity-medium)' : 'var(--severity-high)';

    return (
        <div className="flex items-center gap-2 w-full">
            <div className={`flex-1 bg-muted rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
            {showLabel && (
                <span className="text-xs tabular-nums text-muted-foreground font-medium w-8 text-right">
                    {value}%
                </span>
            )}
        </div>
    );
}