import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FeedPost, LiveOpportunityItem } from '../types.ts';

interface RegionalSnapshotProps {
  feed: FeedPost[];
}

// New color palette for the chart, harmonized with the app theme
const COLORS = ['#D4AF37', '#00C6FF', '#10b981', '#6366f1', '#ec4899', '#d946ef'];

const CustomTooltip = ({ active, payload }: any) => {  
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-nexus-surface-800 border border-nexus-border-medium rounded-lg shadow-lg">
        <p className="label text-nexus-text-primary">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export const RegionalSnapshot: React.FC<RegionalSnapshotProps> = ({ feed }) => {
    const data = useMemo(() => {
        const sectorCounts = feed
            .filter(post => post.type === 'opportunity')
            .reduce((acc, post) => {
                const content = post.content as LiveOpportunityItem;
                const sector = content.sector;
                acc[sector] = (acc[sector] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const sortedData = Object.entries(sectorCounts)
            .map(([name, value]): { name: string; value: number } => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value);
        
        return sortedData;
    }, [feed]);

    if (data.length === 0) {
        return <p className="text-sm text-nexus-text-muted text-center py-4">No opportunity data in feed to build snapshot.</p>;
    }

    return (
        <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        innerRadius={35}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconSize={10} 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right" 
                      wrapperStyle={{fontSize: '12px', color: '#8B949E', paddingLeft: '20px'}}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};