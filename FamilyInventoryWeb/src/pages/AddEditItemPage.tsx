import { ArrowLeft, Camera, Minus, Plus, Trash2, Wand2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { fileToBase64 } from '../utils/helpers';
import { extractItemFromImage } from '../utils/openai';

export const AddEditItemPage: React.FC = () => {
  const { itemId }   = useParams<{ itemId?: string }>();
  const [params]     = useSearchParams();
  const { currentGroup, items, addItem, updateItem, deleteItem } = useGroup();
  const { userProfile } = useAuth();
  const navigate     = useNavigate();
  const fileRef      = useRef<HTMLInputElement>(null);

  const existing = itemId ? items.find((i) => i.id === itemId) : null;
  const isEdit   = !!existing;

  const sortedCats = [...(currentGroup?.categories ?? [])].sort((a, b) => a.order - b.order);
  const defaultCat = params.get('category') ?? sortedCats[0]?.id ?? '';

  const [name,       setName]       = useState(existing?.name       ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? defaultCat);
  const [childId,    setChildId]    = useState(existing?.childId    ?? 'all');
  const [size,       setSize]       = useState(existing?.size       ?? '');
  const [brand,      setBrand]      = useState(existing?.brand      ?? '');
  const [quantity,   setQuantity]   = useState(existing?.quantity   ?? 1);
  const [notes,      setNotes]      = useState(existing?.notes      ?? '');
  const [imageUrl,   setImageUrl]   = useState<string | null>(existing?.imageUrl ?? null);
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [analyzing,  setAnalyzing]  = useState(false);

  const childOptions = [
    { id: 'all', name: 'みんな（共有）', emoji: '🏠', color: '#888' },
    ...(currentGroup?.children ?? []),
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleAiExtract = async () => {
    if (!imageFile && !imageUrl) {
      toast.error('先に写真を選択してください');
      return;
    }
    if (!userProfile?.openaiApiKey) {
      toast.error('設定画面でOpenAI APIキーを登録してください');
      navigate('/settings');
      return;
    }
    setAnalyzing(true);
    try {
      const base64 = imageFile
        ? await fileToBase64(imageFile)
        : imageUrl!;
      const extracted = await extractItemFromImage(userProfile.openaiApiKey, base64);
      if (extracted.name)     setName(extracted.name);
      if (extracted.size)     setSize(extracted.size);
      if (extracted.brand)    setBrand(extracted.brand);
      if (extracted.notes)    setNotes(extracted.notes);
      // Try to match category
      if (extracted.category) {
        const matched = currentGroup?.categories.find(
          (c) => c.name.includes(extracted.category) || extracted.category.includes(c.name),
        );
        if (matched) setCategoryId(matched.id);
      }
      toast.success('AIで情報を読み取りました！');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'AI読み取りに失敗しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())   { toast.error('アイテム名を入力してください'); return; }
    if (!categoryId)    { toast.error('カテゴリを選択してください');   return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        categoryId,
        childId,
        size: size.trim(),
        brand: brand.trim(),
        quantity,
        notes: notes.trim(),
        imageUrl: existing?.imageUrl ?? null,
      };
      if (isEdit && itemId) {
        await updateItem(itemId, payload, imageFile ?? undefined);
        toast.success('更新しました');
      } else {
        await addItem(payload, imageFile ?? undefined);
        toast.success('追加しました');
      }
      navigate(-1);
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteItem(itemId);
    toast.success('削除しました');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-gray-800">{isEdit ? 'アイテムを編集' : 'アイテムを追加'}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-500 text-white text-sm font-bold px-4 py-2 rounded-full
                       disabled:opacity-50 active:scale-95 transition-transform"
          >
            {saving ? '保存中' : '保存'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto pb-24">
        {/* Image section */}
        <div className="bg-white px-4 pt-4 pb-5 border-b border-gray-100">
          <div className="flex gap-3 items-start">
            {/* Image preview */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200
                         flex flex-col items-center justify-center gap-1 flex-shrink-0
                         overflow-hidden bg-gray-50 active:scale-95 transition-transform"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={24} className="text-gray-300" />
                  <span className="text-xs text-gray-400">写真を追加</span>
                </>
              )}
            </button>

            {/* AI extraction button */}
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <p className="text-xs text-gray-500 leading-relaxed">
                写真を選んで「AI自動入力」を押すと、写真からアイテム情報を自動で入力します。
              </p>
              <button
                type="button"
                onClick={handleAiExtract}
                disabled={analyzing || (!imageFile && !imageUrl)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                           border-[1.5px] border-primary-400 text-primary-500
                           disabled:opacity-40 active:scale-95 transition-transform"
              >
                <Wand2 size={16} />
                {analyzing ? 'AI解析中...' : 'AI自動入力'}
              </button>
              {!userProfile?.openaiApiKey && (
                <p className="text-[11px] text-amber-500">
                  ⚠ APIキー未設定。設定画面から登録できます。
                </p>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Form fields */}
        <div className="px-4 py-4 space-y-5">
          {/* Name */}
          <Field label="アイテム名 *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ユニクロ ヒートテック"
              className="input"
              required
            />
          </Field>

          {/* Category */}
          <Field label="カテゴリ *">
            <div className="flex flex-wrap gap-2">
              {sortedCats.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border-[1.5px] text-sm font-semibold
                             transition-colors ${
                    categoryId === cat.id
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <span>{cat.emoji}</span> {cat.name}
                </button>
              ))}
            </div>
          </Field>

          {/* Child */}
          <Field label="持ち主">
            <div className="flex flex-wrap gap-2">
              {childOptions.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setChildId(child.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border-[1.5px] text-sm font-semibold transition-colors"
                  style={
                    childId === child.id
                      ? { backgroundColor: child.color, borderColor: child.color, color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#4a5568' }
                  }
                >
                  <span>{child.emoji}</span> {child.name}
                </button>
              ))}
            </div>
          </Field>

          {/* Size & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="サイズ">
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="90cm, M..."
                className="input"
              />
            </Field>
            <Field label="ブランド">
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ユニクロ..."
                className="input"
              />
            </Field>
          </div>

          {/* Quantity */}
          <Field label="数量">
            <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden
                            w-fit bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-3 bg-primary-50 text-primary-500 active:bg-primary-100"
              >
                <Minus size={16} />
              </button>
              <span className="px-6 text-lg font-black text-gray-800 min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-3 bg-primary-50 text-primary-500 active:bg-primary-100"
              >
                <Plus size={16} />
              </button>
            </div>
          </Field>

          {/* Notes */}
          <Field label="メモ">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="購入場所、状態など..."
              rows={3}
              className="input resize-none"
            />
          </Field>

          {/* Delete button (edit mode) */}
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         text-red-500 border border-red-200 bg-red-50 font-semibold text-sm
                         active:scale-[0.98] transition-transform mt-4"
            >
              <Trash2 size={16} />
              このアイテムを削除
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);
