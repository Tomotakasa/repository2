import { UserPlus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CategoryCard } from '../components/CategoryCard';
import { ChildFilterTabs } from '../components/ChildFilterTabs';
import { InviteModal } from '../components/InviteModal';
import { Layout } from '../components/Layout';
import { useGroup } from '../contexts/GroupContext';

export const HomePage: React.FC = () => {
  const { currentGroup, items } = useGroup();
  const [selectedChildId, setSelectedChildId] = useState('all');
  const [showInvite, setShowInvite] = useState(false);

  const sortedCategories = useMemo(
    () => [...(currentGroup?.categories ?? [])].sort((a, b) => a.order - b.order),
    [currentGroup?.categories],
  );

  const filteredItems = useMemo(() => {
    if (selectedChildId === 'all') return items;
    return items.filter((i) => i.childId === selectedChildId || i.childId === 'all');
  }, [items, selectedChildId]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number }> = {};
    for (const cat of sortedCategories) {
      const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
      map[cat.id] = {
        count: catItems.length,
        totalQty: catItems.reduce((s, i) => s + i.quantity, 0),
      };
    }
    return map;
  }, [sortedCategories, filteredItems]);

  const totalQty = useMemo(
    () => filteredItems.reduce((s, i) => s + i.quantity, 0),
    [filteredItems],
  );

  const selectedChild = currentGroup?.children.find((c) => c.id === selectedChildId);

  return (
    <Layout
      headerRight={
        <button
          onClick={() => setShowInvite(true)}
          className="p-2 rounded-full bg-primary-50 text-primary-500"
        >
          <UserPlus size={18} />
        </button>
      }
    >
      {/* Hero banner */}
      <div
        className="px-4 py-5 text-white"
        style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%)' }}
      >
        <p className="text-xs font-bold opacity-75 uppercase tracking-widest">在庫サマリー</p>
        <p className="text-3xl font-black mt-1">
          {totalQty} <span className="text-lg font-semibold opacity-80">個</span>
        </p>
        {selectedChild && (
          <p className="text-sm opacity-90 mt-1">
            {selectedChild.emoji} {selectedChild.name} の持ち物 + みんなの共有
          </p>
        )}
      </div>

      {/* Child filter tabs */}
      <ChildFilterTabs
        children={currentGroup?.children ?? []}
        selectedId={selectedChildId}
        onSelect={setSelectedChildId}
      />

      {/* Category list */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">カテゴリ</p>
        {sortedCategories.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            カテゴリがありません。設定から追加してください。
          </p>
        ) : (
          sortedCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              count={categoryStats[cat.id]?.count ?? 0}
              totalQty={categoryStats[cat.id]?.totalQty ?? 0}
            />
          ))
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </Layout>
  );
};
