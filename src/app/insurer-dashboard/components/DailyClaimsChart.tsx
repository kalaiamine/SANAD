'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getDailyClaimsData } from '@/data/mockClaims';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl shadow-elevated px-4 py-3 text-sm">
                <p className="font-semibold text-foreground mb-2">{label}</p>
                {payload.map((p) => (
                    <div key={`tt-${p.name}`} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.name}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function DailyClaimsChart() {
    const data = getDailyClaimsData();

    return (
        <div className="card-base p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="section-label mb-1">Volume quotidien</p>
                    <h3 className="text-base font-semibold text-foreground">Dossiers — 14 derniers jours</h3>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted px-2 py-1 rounded-md border border-border/60 tracking-wide">
                    DÉMO
                </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} barSize={8} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
                        axisLine={false}
                        tickLine={false}
                        interval={1}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', radius: 4 }} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)', paddingTop: '8px' }}
                    />
                    <Bar dataKey="critical" name="Critique" fill="var(--severity-critical)" radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="high" name="Élevé" fill="var(--severity-high)" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="medium" name="Modéré" fill="var(--severity-medium)" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="low" name="Faible" fill="var(--severity-low)" radius={[0, 0, 3, 3]} stackId="a" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}