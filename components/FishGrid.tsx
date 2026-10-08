
import React from 'react';
import type { Fish } from '../types.ts';
import FishCard from './FishCard.tsx';

interface FishGridProps {
  fishes: Fish[];
  onSelectFish: (fish: Fish) => void;
}

const FishGrid: React.FC<FishGridProps> = ({ fishes, onSelectFish }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 max-w-5xl mx-auto">
      {fishes.map((fish) => (
        <FishCard key={fish.id} fish={fish} onSelectFish={onSelectFish} />
      ))}
    </div>
  );
};

export default FishGrid;