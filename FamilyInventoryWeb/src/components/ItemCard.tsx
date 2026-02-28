import { ImageOff } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Child, InventoryItem } from '../types';
import { hexToRgba } from '../utils/helpers';

interface Props {
  item: InventoryItem;
  child: Child | null;
}

export const ItemCard: React.FC<Props> = ({ item, child }) => {
  const navigate = useNavigate();
  const accent = child?.color ?? '#B0BEC5';

  return (
    <button
      onClick={() => navigate(`/item/${item.id}/edit`)}
      className="flex flex-col rounded-2xl border-[1.5px] overflow-hidden text-left
                 active:scale-[0.97] transition-transform w-full"
      style={{
        backgroundColor: hexToRgba(accent, 0.08),
        borderColor: hexToRgba(accent, 0.25),
      }}
    >
      {/* Image */}
      <div
        className="relative w-full aspect-square flex items-center justify-center"
        style={{ backgroundColor: hexToRgba(accent, 0.15) }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageOff size={32} style={{ color: hexToRgba(accent, 0.4) }} />
        )}
        {/* Child badge */}
        {child && (
          <span
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center
                       justify-center text-xs shadow-sm"
            style={{ backgroundColor: child.color }}
          >
            {child.emoji}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{item.name}</p>
        {item.size && (
          <p className="text-xs font-bold" style={{ color: accent }}>{item.size}</p>
        )}
        {item.brand && (
          <p className="text-xs text-gray-400 truncate">{item.brand}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">× {item.quantity}</p>
      </div>
    </button>
  );
};
