'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { getSeverityDistribution } from '@/data/mockClaims';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { fill: string } }[] }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl shadow-elevated px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="font-semibold text-foreground">{payload[0].name}</span>
                    <span className="text-muted-foreground tabular-nums">{payload[0].value}%</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function SeverityDistributionChart() {
    const data = getSeverityDistribution();

    return (
        <div className="card-base p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="section-label mb-1">Distribution</p>
                    <h3 className="text-base font-semibold text-foreground">Répartition par sévérité</h3>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted px-2 py-1 rounded-md border border-border/60 tracking-wide">
                    DÉMO
                </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)', paddingTop: '4px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}