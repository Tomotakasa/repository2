import { Check, ChevronRight, Download, Edit3, Eye, EyeOff, LogOut, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { InviteModal } from '../components/InviteModal';
import { Layout } from '../components/Layout';
import { SortableList } from '../components/SortableList';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import type { Category, Child } from '../types';
import { CHILD_EMOJIS, generateId } from '../utils/helpers';
import { SEED_ITEM_COUNT, importSeedData } from '../utils/seedData';

/* ──────────────────────────────────────────
   Child edit modal
────────────────────────────────────────── */
const ChildModal: React.FC<{
  child: Partial<Child> & { isNew: boolean };
  onSave: (c: Partial<Child>) => void;
  onClose: () => void;
}> = ({ child: init, onSave, onClose }) => {
  const [name,  setName]  = useState(init.name  ?? '');
  const [emoji, setEmoji] = useState(init.emoji ?? '👶');
  const [color, setColor] = useState(init.color ?? '#FF6B9D');
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-safe space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{init.isNew ? '子供を追加' : '子供を編集'}</h2>
          <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
        </div>

        <div>
          <p className="label-xs mb-2">名前</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="例：たろう" />
        </div>

        <div>
          <p className="label-xs mb-2">アイコン</p>
          <div className="flex flex-wrap gap-2">
            {CHILD_EMOJIS.map((em) => (
              <button
                key={em}
                onClick={() => setEmoji(em)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors ${
                  emoji === em ? 'border-primary-500 bg-primary-50' : 'border-transparent bg-gray-100'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label-xs mb-2">カラー</p>
          <button
            onClick={() => setShowPicker(true)}
            className="w-full h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow"
            style={{ backgroundColor: color }}
          >
            タップしてカラーを選択
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">キャンセル</button>
          <button
            onClick={() => {
              if (!name.trim()) { toast.error('名前を入力してください'); return; }
              onSave({ name: name.trim(), emoji, color });
              onClose();
            }}
            className="btn-primary flex-1"
          >
            保存
          </button>
        </div>
      </div>
      {showPicker && (
        <ColorPickerModal
          currentColor={color}
          onSelect={setColor}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────
   Category edit modal
────────────────────────────────────────── */
const CategoryModal: React.FC<{
  category: Partial<Category> & { isNew: boolean };
  onSave: (c: Partial<Category>) => void;
  onClose: () => void;
}> = ({ category: init, onSave, onClose }) => {
  const [name,  setName]  = useState(init.name  ?? '');
  const [emoji, setEmoji] = useState(init.emoji ?? '📦');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-safe space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{init.isNew ? 'カテゴリを追加' : 'カテゴリを編集'}</h2>
          <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
        </div>
        <div>
          <p className="label-xs mb-2">カテゴリ名</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="例：パジャマ" />
        </div>
        <div>
          <p className="label-xs mb-2">絵文字アイコン</p>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2) || '📦')}
            className="input text-center text-2xl"
            maxLength={4}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">キャンセル</button>
          <button
            onClick={() => {
              if (!name.trim()) { toast.error('カテゴリ名を入力してください'); return; }
              onSave({ name: name.trim(), emoji });
              onClose();
            }}
            className="btn-primary flex-1"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────
   API Key setup section
────────────────────────────────────────── */
const ApiKeySection: React.FC = () => {
  const { userProfile, updateOpenaiKey } = useAuth();
  const navigate = useNavigate();
  const [key, setKey]         = useState(userProfile?.openaiApiKey ?? '');
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const maskedKey = key ? `sk-...${key.slice(-4)}` : '';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOpenaiKey(key.trim());
      toast.success('APIキーを保存しました');
      void navigate;
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">カメラAI自動入力</p>
          <p className="text-xs text-gray-400">OpenAI GPT-4o Vision</p>
        </div>
        <button
          onClick={() => setShowHelp((v) => !v)}
          className="text-xs text-primary-500 font-semibold"
        >
          {showHelp ? '閉じる' : '設定方法'}
        </button>
      </div>

      {showHelp && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-gray-600 space-y-2">
          <p className="font-bold text-amber-700">📸 カメラAI自動入力の使い方</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>
              <strong>OpenAIアカウントを作成</strong>
              <br />
              <a
                href="https://platform.openai.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 underline"
              >
                platform.openai.com/signup
              </a>
            </li>
            <li>
              <strong>APIキーを発行</strong>
              <br />
              「API Keys」→「Create new secret key」でキーを作成
              <br />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 underline"
              >
                platform.openai.com/api-keys
              </a>
            </li>
            <li>
              <strong>クレジットを追加</strong>（$5〜が目安。1回の解析は約$0.002）
            </li>
            <li>
              <strong>下の入力欄にAPIキーを貼り付けて保存</strong>
            </li>
          </ol>
          <p className="text-amber-600 mt-2">
            🔒 APIキーはあなたのFirestoreアカウントに安全に保存され、他のユーザーは参照できません。
            このキーを使ったAPI呼び出しの費用はあなたのOpenAIアカウントに課金されます。
          </p>
        </div>
      )}

      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="input pr-12 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {!show && maskedKey && (
        <p className="text-xs text-gray-400">現在: {maskedKey}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !key.trim()}
        className="btn-primary w-full text-sm"
      >
        {saving ? '保存中...' : 'APIキーを保存'}
      </button>
    </div>
  );
};

/* ──────────────────────────────────────────
   Main settings page
────────────────────────────────────────── */
export const SettingsPage: React.FC = () => {
  const { signOut, user } = useAuth();
  const {
    currentGroup, groups, setCurrentGroupId,
    updateGroupName,
    addChild, updateChild, deleteChild,
    addCategory, updateCategory, deleteCategory, reorderCategories,
  } = useGroup();

  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft,   setGroupNameDraft]   = useState('');
  const [childModal,  setChildModal]  = useState<null | (Partial<Child>  & { isNew: boolean })>(null);
  const [catModal,    setCatModal]    = useState<null | (Partial<Category> & { isNew: boolean })>(null);
  const [showInvite,  setShowInvite]  = useState(false);
  const [importing,   setImporting]   = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleImportSeedData = async () => {
    if (!currentGroup || !user) return;
    if (!confirm(`スプレッドシートのデータ ${SEED_ITEM_COUNT} 件をインポートしますか？\n既存のアイテムは削除されません。`)) return;
    setImporting(true);
    setImportProgress(0);
    try {
      await importSeedData(
        currentGroup.id,
        currentGroup.categories,
        currentGroup.children,
        user.uid,
        (count, total) => setImportProgress(Math.round((count / total) * 100)),
      );
      toast.success(`${SEED_ITEM_COUNT} 件のデータをインポートしました`);
    } catch {
      toast.error('インポートに失敗しました');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const sortedCategories = useMemo(
    () => [...(currentGroup?.categories ?? [])].sort((a, b) => a.order - b.order),
    [currentGroup?.categories],
  );

  const saveGroupName = async () => {
    if (groupNameDraft.trim()) await updateGroupName(groupNameDraft.trim());
    setEditingGroupName(false);
  };

  return (
    <Layout title="設定">
      <div className="px-4 py-4 space-y-6 pb-10">

        {/* ── Group selector ── */}
        <Section title="グループ" emoji="🏠">
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className={`card flex items-center gap-3 p-3 ${
                  g.id === currentGroup?.id ? 'ring-2 ring-primary-400' : ''
                }`}
              >
                <button
                  onClick={() => setCurrentGroupId(g.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{g.name}</p>
                    <p className="text-xs text-gray-400">
                      {Object.keys(g.members).length}人のメンバー
                    </p>
                  </div>
                  {g.id === currentGroup?.id && (
                    <Check size={16} className="text-primary-500 ml-auto" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.assign('/groups')}
            className="btn-secondary w-full mt-2 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={15} /> 別のグループを追加 / 参加
          </button>
        </Section>

        {/* ── Group name ── */}
        {currentGroup && (
          <Section title="グループ名" emoji="✏️">
            <div className="card p-4">
              {editingGroupName ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={groupNameDraft}
                    onChange={(e) => setGroupNameDraft(e.target.value)}
                    className="input flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && saveGroupName()}
                  />
                  <button onClick={saveGroupName} className="btn-primary px-4 text-sm">保存</button>
                </div>
              ) : (
                <button
                  onClick={() => { setGroupNameDraft(currentGroup.name); setEditingGroupName(true); }}
                  className="flex items-center justify-between w-full"
                >
                  <span className="font-bold text-gray-800 text-lg">{currentGroup.name}</span>
                  <Edit3 size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </Section>
        )}

        {/* ── Members ── */}
        {currentGroup && (
          <Section title="メンバー" emoji="👥">
            <div className="card divide-y divide-gray-100">
              {Object.entries(currentGroup.members).map(([uid, role]) => (
                <div key={uid} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {currentGroup.memberNames[uid] ?? uid}
                      {uid === user?.uid && ' （あなた）'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {role === 'owner' ? '管理者' : role === 'admin' ? '副管理者' : 'メンバー'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
            >
              <UserPlus size={16} /> メンバーを招待
            </button>
          </Section>
        )}

        {/* ── Children ── */}
        <Section title="子供" emoji="👧👦">
          <div className="card divide-y divide-gray-100">
            {(currentGroup?.children ?? []).map((child) => (
              <div key={child.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: child.color }}
                >
                  {child.emoji}
                </div>
                <p className="flex-1 font-semibold text-gray-800">{child.name}</p>
                <button
                  onClick={() => setChildModal({ ...child, isNew: false })}
                  className="p-2 rounded-lg bg-gray-100 text-gray-500"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`「${child.name}」を削除しますか？`)) {
                      deleteChild(child.id).then(() => toast.success('削除しました'));
                    }
                  }}
                  className="p-2 rounded-lg bg-red-50 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setChildModal({ isNew: true })}
              className="flex items-center gap-2 px-4 py-3 text-primary-500 font-semibold text-sm w-full"
            >
              <Plus size={16} /> 子供を追加
            </button>
          </div>
        </Section>

        {/* ── Categories with drag-and-drop ── */}
        <Section title="カテゴリ" emoji="📂">
          <p className="text-xs text-gray-400 mb-2 px-1">≡ を長押しまたはドラッグして並び替え</p>
          <div className="card overflow-hidden">
            <SortableList
              items={sortedCategories}
              onReorder={(reordered) => reorderCategories(reordered).catch(() => toast.error('並び替えに失敗しました'))}
              renderItem={(cat) => (
                <div className="flex items-center gap-3 py-3 pr-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="flex-1 font-semibold text-gray-800 text-sm">{cat.name}</span>
                  <button
                    onClick={() => setCatModal({ ...cat, isNew: false })}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`「${cat.name}」を削除しますか？\nこのカテゴリのアイテムも削除されます。`)) {
                        deleteCategory(cat.id).then(() => toast.success('削除しました'));
                      }
                    }}
                    className="p-2 rounded-lg bg-red-50 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            />
            <button
              onClick={() => setCatModal({ isNew: true })}
              className="flex items-center gap-2 px-4 py-3 text-primary-500 font-semibold text-sm
                         border-t border-gray-100 w-full"
            >
              <Plus size={16} /> カテゴリを追加
            </button>
          </div>
        </Section>

        {/* ── Seed data import ── */}
        {currentGroup && (
          <Section title="データインポート" emoji="📥">
            <div className="card p-4 space-y-3">
              <p className="text-sm text-gray-600">
                スプレッドシートのデータ（{SEED_ITEM_COUNT} 件）を一括登録します。
                子供・カテゴリは現在のグループ設定に合わせて自動マッピングされます。
              </p>
              {importing && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">{importProgress}%</p>
                </div>
              )}
              <button
                onClick={handleImportSeedData}
                disabled={importing}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                {importing ? `インポート中… ${importProgress}%` : 'データを一括インポート'}
              </button>
            </div>
          </Section>
        )}

        {/* ── Camera AI API key ── */}
        <Section title="カメラAI設定" emoji="🤖">
          <div className="card p-4">
            <ApiKeySection />
          </div>
        </Section>

        {/* ── Danger zone ── */}
        <Section title="アカウント" emoji="👤">
          <div className="card p-4 space-y-3">
            <div className="text-sm">
              <p className="font-semibold text-gray-700">{user?.displayName}</p>
              <p className="text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={() => { signOut(); window.location.assign('/auth'); }}
              className="flex items-center gap-2 text-red-500 text-sm font-semibold"
            >
              <LogOut size={16} /> ログアウト
            </button>
          </div>
        </Section>
      </div>

      {/* Modals */}
      {childModal && (
        <ChildModal
          child={childModal}
          onSave={(data) => {
            if (childModal.isNew) {
              addChild({
                name: data.name!,
                color: data.color ?? '#FF6B9D',
                emoji: data.emoji ?? '👶',
              }).then(() => toast.success('追加しました'));
            } else {
              updateChild(childModal.id!, data).then(() => toast.success('更新しました'));
            }
          }}
          onClose={() => setChildModal(null)}
        />
      )}

      {catModal && (
        <CategoryModal
          category={catModal}
          onSave={(data) => {
            if (catModal.isNew) {
              addCategory({ name: data.name!, emoji: data.emoji ?? '📦' })
                .then(() => toast.success('追加しました'));
            } else {
              updateCategory(catModal.id!, data).then(() => toast.success('更新しました'));
            }
          }}
          onClose={() => setCatModal(null)}
        />
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </Layout>
  );
};

const Section: React.FC<{ title: string; emoji: string; children: React.ReactNode }> = ({
  title, emoji, children,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 px-1">
      <span className="text-sm">{emoji}</span>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
    {children}
  </div>
);
