import { Check, Copy, Link, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useGroup } from '../contexts/GroupContext';
import type { InviteCode } from '../types';

interface Props {
  onClose: () => void;
}

export const InviteModal: React.FC<Props> = ({ onClose }) => {
  const { generateInvite, getInviteCodes, deleteInviteCode, currentGroup } = useGroup();
  const [codes, setCodes]     = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);

  useEffect(() => {
    getInviteCodes().then(setCodes);
  }, [getInviteCodes]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const code = await generateInvite();
      toast.success('招待コードを作成しました');
      const fresh = await getInviteCodes();
      setCodes(fresh);
      void code;
    } catch (e) {
      toast.error('生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    const shareText = `「${currentGroup?.name}」に招待します！\n招待コード: ${code}\n※おうち在庫帳アプリ内でコードを入力してください`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(code);
      toast.success('クリップボードにコピーしました');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleDelete = async (id: string) => {
    await deleteInviteCode(id);
    setCodes((prev) => prev.filter((c) => c.code !== id));
    toast.success('招待コードを削除しました');
  };

  const activeCodes = codes.filter((c) => {
    const exp = c.expiresAt?.toDate?.() ?? new Date(0);
    return c.isActive && exp > new Date();
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-safe space-y-4 shadow-2xl
                   max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">メンバーを招待</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={22} /></button>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
          招待コードを作成して、LINEやメールでシェアしましょう。
          コードを受け取った人はアプリ内の「グループに参加」から入力できます。
        </p>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Link size={18} />
          {loading ? '作成中...' : '招待コードを作成'}
        </button>

        {/* Active codes */}
        {activeCodes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">有効なコード</p>
            {activeCodes.map((c) => {
              const exp = c.expiresAt?.toDate?.() ?? new Date(0);
              const hoursLeft = Math.max(0, Math.round((exp.getTime() - Date.now()) / 3600000));
              return (
                <div key={c.code} className="card p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-mono text-xl font-black text-primary-500 tracking-widest">
                      {c.code}
                    </p>
                    <p className="text-xs text-gray-400">
                      残り {hoursLeft}時間 · {c.usedCount}人が使用済み
                    </p>
                  </div>
                  <button
                    onClick={() => copyCode(c.code)}
                    className="p-2 rounded-xl bg-primary-50 text-primary-500 active:scale-90 transition-transform"
                  >
                    {copied === c.code ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(c.code)}
                    className="p-2 rounded-xl bg-red-50 text-red-400 active:scale-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
