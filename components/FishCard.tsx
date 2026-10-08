
import React from 'react';
import type { Fish } from '../types.ts';
import AuthenticatedImage from './AuthenticatedImage';

interface FishCardProps {
  fish: Fish;
  onSelectFish: (fish: Fish) => void;
}

const UncaughtFishPlaceholder = () => (
    <div className="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center">
        <span className="text-gray-400 text-6xl font-bold select-none">?</span>
    </div>
);

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);


const FishCard: React.FC<FishCardProps> = ({ fish, onSelectFish }) => {
    const hasBeenCaught = fish.catches.length > 0;
    const coverCatch = fish.catches.find(c => c.id === fish.coverImageCatchId) || (hasBeenCaught ? fish.catches[0] : null);

    const ratings = fish.catches
        .map(c => c.tasteRating)
        .filter((r): r is number => r !== undefined && r > 0);
    
    const avgRating = ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 0;

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 group border border-gray-100"
      onClick={() => onSelectFish(fish)}
      aria-label={`${fish.name}。${hasBeenCaught ? `最近釣ったのは${coverCatch!.date}` : 'まだ釣れていません'}`}
    >
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        {hasBeenCaught && coverCatch ? (
          <AuthenticatedImage
            source={coverCatch.imageUrl}
            alt={fish.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:brightness-105 bg-gray-100"
            loading="lazy"
          />
        ) : (
          <UncaughtFishPlaceholder />
        )}
        
        {hasBeenCaught && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow">
                <span>{fish.catches.length}匹</span>
            </div>
        )}
      </div>
      <div className="px-3 py-2.5 min-h-[68px]">
        <h3 className="text-gray-800 text-sm md:text-base font-bold leading-snug">
          {fish.name}
          {fish.isPoisonous && <span className="text-red-500 text-xs ml-1.5 font-semibold align-middle">(毒あり)</span>}
        </h3>
        {avgRating > 0 && (
          <div className="flex items-center mt-1 text-gray-600 text-xs">
            <span className="font-semibold mr-1">味：</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={i < avgRating ? 'text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FishCard;