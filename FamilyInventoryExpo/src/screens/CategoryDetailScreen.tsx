import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemCard } from '../components/ItemCard';
import { useApp } from '../contexts/AppContext';
import { InventoryItem, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

const ALL = 'all';

export const CategoryDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const { data, deleteItem } = useApp();

  const category = data.categories.find((c) => c.id === categoryId);

  // Filter state
  const [filterSize, setFilterSize] = useState<string>(ALL);
  const [filterBrand, setFilterBrand] = useState<string>(ALL);
  const [filterChildId, setFilterChildId] = useState<string>(ALL);

  const categoryItems = useMemo(
    () => data.items.filter((i) => i.categoryId === categoryId),
    [data.items, categoryId],
  );

  // Unique values for filter dropdowns
  const sizes = useMemo(
    () => [ALL, ...Array.from(new Set(categoryItems.map((i) => i.size).filter(Boolean)))],
    [categoryItems],
  );
  const brands = useMemo(
    () => [ALL, ...Array.from(new Set(categoryItems.map((i) => i.brand).filter(Boolean)))],
    [categoryItems],
  );
  const childOptions = useMemo(() => {
    const ids = Array.from(new Set(categoryItems.map((i) => i.childId)));
    return [ALL, ...ids];
  }, [categoryItems]);

  // Applied filters
  const filteredItems = useMemo(() => {
    return categoryItems.filter((item) => {
      if (filterSize !== ALL && item.size !== filterSize) return false;
      if (filterBrand !== ALL && item.brand !== filterBrand) return false;
      if (filterChildId !== ALL && item.childId !== filterChildId) return false;
      return true;
    });
  }, [categoryItems, filterSize, filterBrand, filterChildId]);

  const getChildForItem = (item: InventoryItem) => {
    if (item.childId === 'all') return null;
    return data.children.find((c) => c.id === item.childId) ?? null;
  };

  const getChildLabel = (id: string) => {
    if (id === ALL) return 'すべて';
    if (id === 'all') return 'みんな';
    return data.children.find((c) => c.id === id)?.name ?? id;
  };

  const handleLongPress = (item: InventoryItem) => {
    Alert.alert(
      item.name,
      'このアイテムをどうしますか？',
      [
        { text: '編集', onPress: () => navigation.navigate('AddEditItem', { itemId: item.id }) },
        {
          text: '削除',
          style: 'destructive',
          onPress: () =>
            Alert.alert('確認', `「${item.name}」を削除しますか？`, [
              { text: 'キャンセル', style: 'cancel' },
              { text: '削除', style: 'destructive', onPress: () => deleteItem(item.id) },
            ]),
        },
        { text: 'キャンセル', style: 'cancel' },
      ],
    );
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text>カテゴリが見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.emoji}>{category.emoji}</Text>
          <Text style={styles.title}>{category.name}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredItems.length}件</Text>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <FilterChip
          label="サイズ"
          value={filterSize}
          options={sizes}
          getLabel={(v) => (v === ALL ? 'サイズ' : v)}
          onChange={setFilterSize}
        />
        <FilterChip
          label="ブランド"
          value={filterBrand}
          options={brands}
          getLabel={(v) => (v === ALL ? 'ブランド' : v)}
          onChange={setFilterBrand}
        />
        <FilterChip
          label="持ち主"
          value={filterChildId}
          options={childOptions}
          getLabel={getChildLabel}
          onChange={setFilterChildId}
        />
      </View>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{category.emoji}</Text>
          <Text style={styles.emptyText}>アイテムがありません</Text>
          <Text style={styles.emptySubText}>右下の＋ボタンから追加してみましょう</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              child={getChildForItem(item)}
              onPress={() => navigation.navigate('AddEditItem', { itemId: item.id })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('AddEditItem', { categoryId })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
};

// Filter chip component with cycling through options
interface FilterChipProps {
  label: string;
  value: string;
  options: string[];
  getLabel: (v: string) => string;
  onChange: (v: string) => void;
}
const FilterChip: React.FC<FilterChipProps> = ({ value, options, getLabel, onChange }) => {
  const isActive = value !== ALL;
  const currentLabel = getLabel(value);

  const handlePress = () => {
    const idx = options.indexOf(value);
    const next = options[(idx + 1) % options.length];
    onChange(next);
  };

  return (
    <Pressable
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={handlePress}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
        {currentLabel}
      </Text>
      <Ionicons
        name={isActive ? 'close-circle' : 'chevron-down'}
        size={14}
        color={isActive ? '#fff' : '#999'}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    maxWidth: 70,
  },
  chipTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 10,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
