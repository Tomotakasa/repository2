import React from 'react';
import type { Child } from '../types';

interface Props {
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ChildFilterTabs: React.FC<Props> = ({ children, selectedId, onSelect }) => {
  const tabs = [
    { id: 'all', name: 'みんな', emoji: '🏠', color: '#888888' },
    ...children,
  ];

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-gray-100
                    scrollbar-none [-webkit-overflow-scrolling:touch]">
      {tabs.map((tab) => {
        const isSelected = selectedId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                       whitespace-nowrap transition-all active:scale-95 flex-shrink-0 border-[1.5px]"
            style={
              isSelected
                ? { backgroundColor: tab.color, borderColor: tab.color, color: '#fff' }
                : { backgroundColor: '#fff', borderColor: '#e0e0e0', color: '#666' }
            }
          >
            <span>{tab.emoji}</span>
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
};
