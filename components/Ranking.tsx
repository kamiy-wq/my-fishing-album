
import React, { useMemo } from 'react';
import type { Fish } from '../types.ts';

interface RankingProps {
    fishes: Fish[];
}

const parseSize = (size: string | undefined): number => {
    if (!size) return 0;
    const numericPart = parseFloat(size.replace(/[^0-9.]/g, ''));
    return isNaN(numericPart) ? 0 : numericPart;
};

const RankingCard: React.FC<{ title: string, icon: React.ReactNode, data: { name: string, value: string }[] }> = ({ title, icon, data }) => {
    const displayData = data.slice(0, 5);
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[280px] max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <h3 className="font-bold text-lg text-gray-700">{title}</h3>
            </div>
            {data.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-4">まだデータがありません。</p>
            ) : (
                <ol className="space-y-2">
                    {displayData.map((item, index) => (
                        <li key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-gray-50">
                            <div className="flex items-center">
                                <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-500' : 'text-orange-500'}`}>
                                    {index + 1}位
                                </span>
                                <span className="ml-2 font-semibold text-gray-800">{item.name}</span>
                            </div>
                            <span className="font-bold text-blue-600">{item.value}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};

const Ranking: React.FC<RankingProps> = ({ fishes }) => {
    const biggestFishRanking = useMemo(() => {
        return fishes
            .flatMap(fish => fish.catches.map(c => ({ ...c, fishName: fish.name })))
            .filter(c => c.size)
            .sort((a, b) => parseSize(b.size) - parseSize(a.size))
            .map(c => ({ name: `${c.angler} (${c.fishName})`, value: c.size! }));
    }, [fishes]);

    return (
        <div>
            <h2 className="text-xl font-bold text-center mb-4 text-blue-800">家族ランキング</h2>
            <div className="flex flex-wrap gap-4 justify-center">
                <RankingCard 
                    title="大物賞"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3,12h2.5l1.8-4.3l3.4,9.4l3.1-6.9l1.7,4.3H21" /></svg>}
                    data={biggestFishRanking}
                />
            </div>
        </div>
    );
};

export default Ranking;