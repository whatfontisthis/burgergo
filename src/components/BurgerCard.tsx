import { memo } from 'react';
import type { MenuItem } from '../constants/menu';

interface BurgerCardProps {
  item: MenuItem;
}

const BurgerCard = memo(({ item }: BurgerCardProps) => {
  return (
    <div className="rounded-2xl flex flex-col overflow-hidden border-2 border-black bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      {/* Content Section */}
      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-xl xl:text-2xl font-bold text-black mb-2 leading-tight">{item.name}</h3>
          <p className="text-sm text-black/70 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>
        <div className="pt-4 border-t border-black/10">
          <p className="text-2xl xl:text-3xl font-black text-black">₩{item.price.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
});

BurgerCard.displayName = 'BurgerCard';

export default BurgerCard;
