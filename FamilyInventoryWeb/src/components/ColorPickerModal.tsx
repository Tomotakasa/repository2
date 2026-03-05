import { Check, X } from 'lucide-react';
import React from 'react';
import { PRESET_COLORS } from '../utils/helpers';

interface Props {
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export const ColorPickerModal: React.FC<Props> = ({ currentColor, onSelect, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">カラーを選択</h3>
        <button onClick={onClose} className="p-1 text-gray-400">
          <X size={20} />
        </button>
      </div>
      {/* Preview */}
      <div
        className="h-12 rounded-xl mb-4 flex items-center justify-center"
        style={{ backgroundColor: currentColor }}
      >
        <span className="text-white font-bold text-sm drop-shadow">プレビュー</span>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-5 gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => { onSelect(color); onClose(); }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md
                       active:scale-90 transition-transform mx-auto"
            style={{ backgroundColor: color }}
          >
            {color === currentColor && <Check size={18} color="#fff" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  </div>
);
