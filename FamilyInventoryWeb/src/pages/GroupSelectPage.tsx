import { ArrowRight, LogOut, Plus, Users } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';

export const GroupSelectPage: React.FC = () => {
  const { signOut, user } = useAuth();
  const { createGroup, joinGroup, groups, setCurrentGroupId } = useGroup();
  const navigate = useNavigate();

  const [tab, setTab]         = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) { toast.error('グループ名を入力してください'); return; }
    setLoading(true);
    try {
      await createGroup(groupName.trim());
      toast.success('グループを作成しました！');
      navigate('/home');
    } catch {
      toast.error('作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) { toast.error('招待コードを入力してください'); return; }
    setLoading(true);
    try {
      const { groupName: gname } = await joinGroup(inviteCode.trim().toUpperCase());
      toast.success(`「${gname}」に参加しました！`);
      navigate('/home');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? '参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-gray-400">{user?.email}</p>
          <h1 className="text-xl font-black text-gray-800 mt-0.5">グループを選択</h1>
        </div>
        <button onClick={signOut} className="p-2 text-gray-400">
          <LogOut size={20} />
        </button>
      </div>

      {/* Existing groups */}
      {groups.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            参加済みのグループ
          </p>
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setCurrentGroupId(g.id); navigate('/home'); }}
                className="card w-full flex items-center gap-3 p-4 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <span className="text-lg">🏠</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800">{g.name}</p>
                  <p className="text-xs text-gray-400">
                    {Object.keys(g.members).length}人のメンバー
                  </p>
                </div>
                <ArrowRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create / Join tabs */}
      <div className="card p-4">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'create' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Plus size={15} /> 新規作成
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'join' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Users size={15} /> 招待コードで参加
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-sm text-gray-500">
              新しいグループを作ってメンバーを招待できます。
            </p>
            <input
              type="text"
              placeholder="例：田中家の在庫帳"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input"
              maxLength={30}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '作成中...' : 'グループを作成'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3">
            <p className="text-sm text-gray-500">
              既存グループの管理者からもらった招待コードを入力してください。
            </p>
            <input
              type="text"
              placeholder="招待コード（例：ABC123）"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input font-mono text-center text-xl tracking-widest"
              maxLength={10}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '参加中...' : 'グループに参加'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
