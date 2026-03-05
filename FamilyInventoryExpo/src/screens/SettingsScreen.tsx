import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { useApp } from '../contexts/AppContext';
import { Category, Child, RootStackParamList } from '../types';
import { CHILD_EMOJIS } from '../utils/helpers';
import { exportDataAsJson, importDataFromJson } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    data,
    updateFamilyName,
    addChild,
    updateChild,
    deleteChild,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    replaceAllData,
  } = useApp();

  const [familyNameEditing, setFamilyNameEditing] = useState(false);
  const [familyNameDraft, setFamilyNameDraft] = useState(data.familyName);

  // Child edit modal state
  const [childModal, setChildModal] = useState<{
    visible: boolean;
    child: Partial<Child> & { isNew: boolean };
  }>({ visible: false, child: { isNew: true } });

  // Category edit modal state
  const [catModal, setCatModal] = useState<{
    visible: boolean;
    category: Partial<Category> & { isNew: boolean };
  }>({ visible: false, category: { isNew: true } });

  // Color picker state
  const [colorPicker, setColorPicker] = useState<{
    visible: boolean;
    currentColor: string;
    onSelect: (c: string) => void;
  }>({ visible: false, currentColor: '#FF6B9D', onSelect: () => {} });

  const sortedCategories = [...data.categories].sort((a, b) => a.order - b.order);

  // ----- Handlers -----
  const handleSaveFamilyName = () => {
    if (familyNameDraft.trim()) {
      updateFamilyName(familyNameDraft.trim());
    }
    setFamilyNameEditing(false);
  };

  const openNewChild = () =>
    setChildModal({
      visible: true,
      child: { name: '', color: '#FF6B9D', emoji: '👶', isNew: true },
    });

  const openEditChild = (child: Child) =>
    setChildModal({
      visible: true,
      child: { ...child, isNew: false },
    });

  const saveChild = () => {
    const { isNew, ...childData } = childModal.child;
    if (!childData.name?.trim()) {
      Alert.alert('名前を入力してください');
      return;
    }
    if (isNew) {
      addChild({
        name: childData.name!.trim(),
        color: childData.color ?? '#FF6B9D',
        emoji: childData.emoji ?? '👶',
      });
    } else if (childData.id) {
      updateChild(childData.id, {
        name: childData.name!.trim(),
        color: childData.color,
        emoji: childData.emoji,
      });
    }
    setChildModal({ visible: false, child: { isNew: true } });
  };

  const openNewCategory = () =>
    setCatModal({
      visible: true,
      category: { name: '', emoji: '📦', isNew: true },
    });

  const openEditCategory = (cat: Category) =>
    setCatModal({ visible: true, category: { ...cat, isNew: false } });

  const saveCategory = () => {
    const { isNew, ...catData } = catModal.category;
    if (!catData.name?.trim()) {
      Alert.alert('カテゴリ名を入力してください');
      return;
    }
    if (isNew) {
      addCategory({ name: catData.name!.trim(), emoji: catData.emoji ?? '📦' });
    } else if (catData.id) {
      updateCategory(catData.id, { name: catData.name!.trim(), emoji: catData.emoji });
    }
    setCatModal({ visible: false, category: { isNew: true } });
  };

  // ----- Data share/import -----
  const handleExport = async () => {
    try {
      const json = exportDataAsJson(data);
      const path = FileSystem.cacheDirectory + 'family_inventory_export.json';
      await FileSystem.writeAsStringAsync(path, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'データをエクスポート',
        });
      } else {
        Alert.alert('共有できません', 'このデバイスでは共有機能を使えません');
      }
    } catch (e) {
      Alert.alert('エクスポートに失敗しました');
      console.error(e);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const imported = importDataFromJson(json);

      Alert.alert(
        'データをインポート',
        `「${imported.familyName}」のデータをインポートします。\n現在のデータは上書きされます。よろしいですか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'インポート',
            onPress: () => {
              replaceAllData(imported);
              Alert.alert('完了', 'データをインポートしました');
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('インポートに失敗しました', 'ファイルの形式が正しくありません');
      console.error(e);
    }
  };

  // ----- Category drag render -----
  const renderCategoryItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Category>) => (
    <ScaleDecorator>
      <View style={[styles.listRow, isActive && styles.listRowDragging]}>
        <Pressable onLongPress={drag} style={styles.dragHandle} hitSlop={8}>
          <Ionicons name="reorder-three" size={22} color="#CCC" />
        </Pressable>
        <Text style={styles.rowEmoji}>{item.emoji}</Text>
        <Text style={styles.rowName}>{item.name}</Text>
        <View style={styles.rowActions}>
          <Pressable
            onPress={() => openEditCategory(item)}
            hitSlop={8}
            style={styles.rowActionBtn}
          >
            <Ionicons name="pencil-outline" size={16} color="#888" />
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('削除', `「${item.name}」を削除しますか？\nこのカテゴリのアイテムも削除されます。`, [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: () => deleteCategory(item.id),
                },
              ])
            }
            hitSlop={8}
            style={styles.rowActionBtn}
          >
            <Ionicons name="trash-outline" size={16} color="#FF4444" />
          </Pressable>
        </View>
      </View>
    </ScaleDecorator>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>設定</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Family name section */}
        <SectionHeader title="ファミリー名" emoji="🏠" />
        <View style={styles.card}>
          {familyNameEditing ? (
            <View style={styles.rowBetween}>
              <TextInput
                style={styles.inlineInput}
                value={familyNameDraft}
                onChangeText={setFamilyNameDraft}
                autoFocus
                onBlur={handleSaveFamilyName}
              />
              <Pressable onPress={handleSaveFamilyName} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={26} color="#4CAF50" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.rowBetween}
              onPress={() => {
                setFamilyNameDraft(data.familyName);
                setFamilyNameEditing(true);
              }}
            >
              <Text style={styles.familyName}>{data.familyName}</Text>
              <Ionicons name="pencil-outline" size={18} color="#999" />
            </Pressable>
          )}
        </View>

        {/* Children section */}
        <SectionHeader title="子供" emoji="👧👦" />
        <View style={styles.card}>
          {data.children.map((child) => (
            <View key={child.id} style={styles.childRow}>
              <View style={[styles.childColorDot, { backgroundColor: child.color }]}>
                <Text style={{ fontSize: 16 }}>{child.emoji}</Text>
              </View>
              <Text style={styles.childName}>{child.name}</Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => openEditChild(child)} hitSlop={8} style={styles.rowActionBtn}>
                  <Ionicons name="pencil-outline" size={16} color="#888" />
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert('削除', `「${child.name}」を削除しますか？`, [
                      { text: 'キャンセル', style: 'cancel' },
                      {
                        text: '削除',
                        style: 'destructive',
                        onPress: () => deleteChild(child.id),
                      },
                    ])
                  }
                  hitSlop={8}
                  style={styles.rowActionBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable style={styles.addRowBtn} onPress={openNewChild}>
            <Ionicons name="add-circle-outline" size={18} color="#FF6B9D" />
            <Text style={styles.addRowBtnText}>子供を追加</Text>
          </Pressable>
        </View>

        {/* Categories section */}
        <SectionHeader title="カテゴリ" emoji="📂" />
        <View style={styles.card}>
          <Text style={styles.hint}>≡ を長押しでドラッグして並び替え</Text>
          <DraggableFlatList
            data={sortedCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            onDragEnd={({ data: reordered }) => reorderCategories(reordered)}
            scrollEnabled={false}
          />
          <Pressable style={styles.addRowBtn} onPress={openNewCategory}>
            <Ionicons name="add-circle-outline" size={18} color="#FF6B9D" />
            <Text style={styles.addRowBtnText}>カテゴリを追加</Text>
          </Pressable>
        </View>

        {/* Data sharing section */}
        <SectionHeader title="データ共有" emoji="📤" />
        <View style={styles.card}>
          <Text style={styles.shareDesc}>
            データをJSONファイルとしてエクスポートし、LINEやメールで家族に共有できます。
            受け取った側はインポートで取り込んでください。
          </Text>
          <View style={styles.shareButtons}>
            <Pressable style={[styles.shareBtn, styles.exportBtn]} onPress={handleExport}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>エクスポート</Text>
            </Pressable>
            <Pressable style={[styles.shareBtn, styles.importBtn]} onPress={handleImport}>
              <Ionicons name="download-outline" size={18} color="#FF6B9D" />
              <Text style={[styles.shareBtnText, { color: '#FF6B9D' }]}>インポート</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Child edit modal */}
      <Modal
        visible={childModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setChildModal({ visible: false, child: { isNew: true } })}
      >
        <TouchableWithoutFeedback
          onPress={() => setChildModal({ visible: false, child: { isNew: true } })}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalPanel}>
                <Text style={styles.modalTitle}>
                  {childModal.child.isNew ? '子供を追加' : '子供を編集'}
                </Text>

                <Text style={styles.modalLabel}>名前</Text>
                <TextInput
                  style={styles.modalInput}
                  value={childModal.child.name ?? ''}
                  onChangeText={(t) =>
                    setChildModal((prev) => ({
                      ...prev,
                      child: { ...prev.child, name: t },
                    }))
                  }
                  placeholder="例：たろう"
                  placeholderTextColor="#CCC"
                />

                <Text style={styles.modalLabel}>アイコン</Text>
                <View style={styles.emojiGrid}>
                  {CHILD_EMOJIS.map((em) => (
                    <Pressable
                      key={em}
                      style={[
                        styles.emojiBtn,
                        childModal.child.emoji === em && {
                          backgroundColor: childModal.child.color + '33',
                          borderColor: childModal.child.color ?? '#FF6B9D',
                        },
                      ]}
                      onPress={() =>
                        setChildModal((prev) => ({
                          ...prev,
                          child: { ...prev.child, emoji: em },
                        }))
                      }
                    >
                      <Text style={{ fontSize: 22 }}>{em}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.modalLabel}>カラー</Text>
                <Pressable
                  style={[
                    styles.colorPreviewBtn,
                    { backgroundColor: childModal.child.color ?? '#FF6B9D' },
                  ]}
                  onPress={() =>
                    setColorPicker({
                      visible: true,
                      currentColor: childModal.child.color ?? '#FF6B9D',
                      onSelect: (c) =>
                        setChildModal((prev) => ({
                          ...prev,
                          child: { ...prev.child, color: c },
                        })),
                    })
                  }
                >
                  <Text style={styles.colorPreviewText}>タップしてカラーを選択</Text>
                </Pressable>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() =>
                      setChildModal({ visible: false, child: { isNew: true } })
                    }
                  >
                    <Text style={styles.modalCancelText}>キャンセル</Text>
                  </Pressable>
                  <Pressable style={styles.modalSaveBtn} onPress={saveChild}>
                    <Text style={styles.modalSaveText}>保存</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category edit modal */}
      <Modal
        visible={catModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatModal({ visible: false, category: { isNew: true } })}
      >
        <TouchableWithoutFeedback
          onPress={() => setCatModal({ visible: false, category: { isNew: true } })}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalPanel}>
                <Text style={styles.modalTitle}>
                  {catModal.category.isNew ? 'カテゴリを追加' : 'カテゴリを編集'}
                </Text>

                <Text style={styles.modalLabel}>カテゴリ名</Text>
                <TextInput
                  style={styles.modalInput}
                  value={catModal.category.name ?? ''}
                  onChangeText={(t) =>
                    setCatModal((prev) => ({
                      ...prev,
                      category: { ...prev.category, name: t },
                    }))
                  }
                  placeholder="例：パジャマ"
                  placeholderTextColor="#CCC"
                />

                <Text style={styles.modalLabel}>絵文字アイコン</Text>
                <TextInput
                  style={[styles.modalInput, { fontSize: 24, textAlign: 'center' }]}
                  value={catModal.category.emoji ?? '📦'}
                  onChangeText={(t) =>
                    setCatModal((prev) => ({
                      ...prev,
                      category: { ...prev.category, emoji: t.slice(-2) || '📦' },
                    }))
                  }
                  placeholder="📦"
                  maxLength={4}
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() =>
                      setCatModal({ visible: false, category: { isNew: true } })
                    }
                  >
                    <Text style={styles.modalCancelText}>キャンセル</Text>
                  </Pressable>
                  <Pressable style={styles.modalSaveBtn} onPress={saveCategory}>
                    <Text style={styles.modalSaveText}>保存</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Color picker */}
      <ColorPickerModal
        visible={colorPicker.visible}
        currentColor={colorPicker.currentColor}
        onSelect={colorPicker.onSelect}
        onClose={() => setColorPicker((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const SectionHeader: React.FC<{ title: string; emoji: string }> = ({
  title,
  emoji,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionEmoji}>{emoji}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  familyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  inlineInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B9D',
    paddingVertical: 2,
    marginRight: 10,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  childColorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  rowActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  addRowBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  hint: {
    fontSize: 11,
    color: '#BBB',
    marginBottom: 8,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  listRowDragging: {
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dragHandle: {
    padding: 4,
  },
  rowEmoji: {
    fontSize: 22,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  shareDesc: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginBottom: 14,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exportBtn: {
    backgroundColor: '#FF6B9D',
  },
  importBtn: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FF6B9D',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPreviewBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreviewText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
