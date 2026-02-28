import { ChevronRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';

interface Props {
  category: Category;
  count: number;
  totalQty: number;
}

export const CategoryCard: React.FC<Props> = ({ category, count, totalQty }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/category/${category.id}`)}
      className="card flex items-center gap-4 px-4 py-4 w-full text-left
                 active:scale-[0.98] transition-transform"
    >
      <span className="text-4xl leading-none">{category.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800">{category.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {count === 0 ? 'アイテムなし' : `${count}種類 · 合計 ${totalQty}個`}
        </p>
      </div>
      {count > 0 && (
        <span className="bg-primary-500 text-white text-xs font-black rounded-full
                         min-w-[28px] h-7 flex items-center justify-center px-2">
          {totalQty}
        </span>
      )}
      <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
    </button>
  );
};
