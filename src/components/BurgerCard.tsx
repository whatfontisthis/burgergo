import { memo } from 'react';
import type { MenuItem } from '../constants/menu';

interface BurgerCardProps {
  item: MenuItem;
}

const BurgerCard = memo(({ item }: BurgerCardProps) => {
  return (
    <div className="rounded-2xl flex flex-col overflow-hidden border-[3px] border-burger-accent-red bg-black shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white p-4">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      {/* Content Section */}
      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-xl xl:text-2xl font-bold text-white mb-2 leading-tight">{item.name}</h3>
          <p className="text-xs text-white/80 mb-4 leading-relaxed">{item.description}</p>
        </div>
        <div className="pt-4 border-t border-burger-accent-red/30">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className="w-5 h-5 xl:w-6 xl:h-6 fill-yellow-400 text-yellow-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

BurgerCard.displayName = 'BurgerCard';

export default BurgerCard;
