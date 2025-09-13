
import React, { useMemo } from 'react';
import type { Fish } from '../types.ts';

interface EncyclopediaProgressProps {
  fishes: Fish[];
}

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v1.946l.06.012A5.968 5.968 0 0115.5 8v2.086l.293.293a1 1 0 01-1.414 1.414l-.646-.647V14a1 1 0 11-2 0V11.5a2.5 2.5 0 00-5 0V14a1 1 0 11-2 0V9.828l-.646.647a1 1 0 11-1.414-1.414L4.5 8.793V8a5.968 5.968 0 013.44-4.042l.06-.012V2a1 1 0 011.7-.707l.3-.3a1 1 0 011.4 0l.3.3zM2 16a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const EncyclopediaProgress: React.FC<EncyclopediaProgressProps> = ({ fishes }) => {
  const { caughtSpecies, totalSpecies, completionPercentage } = useMemo(() => {
    const targetFishes = fishes.filter(f => f.id !== 999);
    const total = targetFishes.length;
    const caught = targetFishes.filter(f => f.catches.length > 0).length;
    const percentage = total > 0 ? Math.round((caught / total) * 100) : 0;
    return {
      caughtSpecies: caught,
      totalSpecies: total,
      completionPercentage: percentage,
    };
  }, [fishes]);

  const getTitle = () => {
    if (completionPercentage === 100) return "図鑑コンプリート！おめでとう！";
    if (completionPercentage >= 80) return "コンプリートまであと一息！";
    if (completionPercentage >= 50) return "半分達成！すごい！";
    return "図鑑コレクション";
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 md:mb-8 border-2 border-blue-200">
      <div className="flex items-center justify-center gap-3">
        <TrophyIcon />
        <h2 className="text-xl sm:text-2xl font-bold text-blue-800 tracking-wide">{getTitle()}</h2>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-bold text-blue-600 tracking-tighter">{completionPercentage}</span>
            <span className="text-2xl font-semibold text-blue-500 ml-1">%</span>
        </div>
        <div className="text-center sm:text-left text-sm text-gray-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-lg font-bold text-blue-700">{caughtSpecies}</span>
            <span className="mx-1">/</span>
            <span>{totalSpecies} 種類ゲット！</span>
        </div>
      </div>

      <div className="w-full bg-blue-100 rounded-full h-5 mt-4 overflow-hidden border-2 border-blue-200 shadow-inner">
        <div 
          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end"
          style={{ width: `${completionPercentage}%` }}
        >
            {completionPercentage > 10 && (
                <span className="text-white text-xs font-bold pr-2">{completionPercentage}%</span>
            )}
        </div>
      </div>
    </div>
  );
};

export default EncyclopediaProgress;