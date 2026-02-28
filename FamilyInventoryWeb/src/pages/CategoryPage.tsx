import { ArrowLeft, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemCard } from '../components/ItemCard';
import { useGroup } from '../contexts/GroupContext';

const ALL = 'all';

const FilterChip: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
}> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap
               transition-colors flex-shrink-0 ${
      active
        ? 'bg-primary-500 border-primary-500 text-white'
        : 'bg-white border-gray-200 text-gray-500'
    }`}
  >
    {label}
  </button>
);

export const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { currentGroup, items } = useGroup();
  const navigate = useNavigate();

  const category = currentGroup?.categories.find((c) => c.id === categoryId);

  const [filterSize,    setFilterSize]    = useState(ALL);
  const [filterBrand,   setFilterBrand]   = useState(ALL);
  const [filterChildId, setFilterChildId] = useState(ALL);

  const catItems = useMemo(
    () => items.filter((i) => i.categoryId === categoryId),
    [items, categoryId],
  );

  const sizes  = useMemo(() => [ALL, ...Array.from(new Set(catItems.map((i) => i.size).filter(Boolean)))], [catItems]);
  const brands = useMemo(() => [ALL, ...Array.from(new Set(catItems.map((i) => i.brand).filter(Boolean)))], [catItems]);
  const childIds = useMemo(
    () => [ALL, ...Array.from(new Set(catItems.map((i) => i.childId)))],
    [catItems],
  );

  const filtered = useMemo(
    () =>
      catItems.filter(
        (i) =>
          (filterSize    === ALL || i.size    === filterSize) &&
          (filterBrand   === ALL || i.brand   === filterBrand) &&
          (filterChildId === ALL || i.childId === filterChildId),
      ),
    [catItems, filterSize, filterBrand, filterChildId],
  );

  const getChild = (childId: string) =>
    currentGroup?.children.find((c) => c.id === childId) ?? null;

  const getChildLabel = (id: string) => {
    if (id === ALL) return '全員';
    if (id === 'all') return 'みんな';
    return currentGroup?.children.find((c) => c.id === id)?.name ?? id;
  };

  if (!category) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 pt-safe">
        <div className="flex items-center gap-2 h-14 px-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500">
            <ArrowLeft size={22} />
          </button>
          <span className="text-3xl leading-none">{category.emoji}</span>
          <h1 className="flex-1 font-black text-gray-800 text-lg">{category.name}</h1>
          <span className="text-sm text-gray-400 font-semibold">{filtered.length}件</span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2 [-webkit-overflow-scrolling:touch]">
          {/* Size */}
          {sizes.map((s) => (
            <FilterChip
              key={`s-${s}`}
              active={filterSize === s && s !== ALL}
              label={s === ALL ? 'サイズ' : s}
              onClick={() => setFilterSize(filterSize === s ? ALL : s)}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 self-center flex-shrink-0" />
          {/* Brand */}
          {brands.map((b) => (
            <FilterChip
              key={`b-${b}`}
              active={filterBrand === b && b !== ALL}
              label={b === ALL ? 'ブランド' : b}
              onClick={() => setFilterBrand(filterBrand === b ? ALL : b)}
            />
          ))}
          <div className="w-px h-5 bg-gray-200 self-center flex-shrink-0" />
          {/* Child */}
          {childIds.map((id) => (
            <FilterChip
              key={`c-${id}`}
              active={filterChildId === id && id !== ALL}
              label={getChildLabel(id)}
              onClick={() => setFilterChildId(filterChildId === id ? ALL : id)}
            />
          ))}
        </div>
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-20">
          <span className="text-6xl">{category.emoji}</span>
          <p className="text-lg font-bold text-gray-500">アイテムがありません</p>
          <p className="text-sm text-gray-400">＋ボタンから追加してみましょう</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 pb-24">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} child={getChild(item.childId)} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate(`/item/new?category=${categoryId}`)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white
                   flex items-center justify-center shadow-xl shadow-primary-500/40
                   active:scale-90 transition-transform z-20"
      >
        <Plus size={26} />
      </button>
    </div>
  );
};
