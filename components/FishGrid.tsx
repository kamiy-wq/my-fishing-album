
import React from 'react';
import type { Fish } from '../types.ts';
import FishCard from './FishCard.tsx';

interface FishGridProps {
  fishes: Fish[];
  onSelectFish: (fish: Fish) => void;
}

const FishGrid: React.FC<FishGridProps> = ({ fishes, onSelectFish }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {fishes.map((fish) => (
        <FishCard key={fish.id} fish={fish} onSelectFish={onSelectFish} />
      ))}
    </div>
  );
};

export default FishGrid;