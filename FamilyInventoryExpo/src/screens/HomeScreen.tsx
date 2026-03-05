import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoryCard } from '../components/CategoryCard';
import { ChildFilterTabs } from '../components/ChildFilterTabs';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => a.order - b.order),
    [data.categories],
  );

  // Filter items by selected child
  const filteredItems = useMemo(() => {
    if (selectedChildId === 'all') return data.items;
    return data.items.filter(
      (item) => item.childId === selectedChildId || item.childId === 'all',
    );
  }, [data.items, selectedChildId]);

  // Stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalQty: number }> = {};
    for (const cat of data.categories) {
      const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
      stats[cat.id] = {
        count: catItems.length,
        totalQty: catItems.reduce((sum, i) => sum + i.quantity, 0),
      };
    }
    return stats;
  }, [data.categories, filteredItems]);

  const totalItems = useMemo(
    () => filteredItems.reduce((sum, i) => sum + i.quantity, 0),
    [filteredItems],
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  const selectedChild = data.children.find((c) => c.id === selectedChildId);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B9D', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSub}>おうちの在庫帳</Text>
            <Text style={styles.headerTitle}>{data.familyName} 🏠</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statBadge}>
              <Text style={styles.statNum}>{totalItems}</Text>
              <Text style={styles.statLabel}>個</Text>
            </View>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Settings')}
              hitSlop={10}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Child filter tabs */}
      <ChildFilterTabs
        children={data.children}
        selectedId={selectedChildId}
        onSelect={setSelectedChildId}
      />

      {/* Selected child banner */}
      {selectedChild && (
        <View
          style={[
            styles.childBanner,
            { backgroundColor: selectedChild.color + '22', borderColor: selectedChild.color + '44' },
          ]}
        >
          <Text style={styles.childBannerText}>
            {selectedChild.emoji} {selectedChild.name} の持ち物 + みんなの共有アイテム
          </Text>
        </View>
      )}

      {/* Category list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>カテゴリ</Text>
        {sortedCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            count={categoryStats[cat.id]?.count ?? 0}
            totalQty={categoryStats[cat.id]?.totalQty ?? 0}
            onPress={() =>
              navigation.navigate('CategoryDetail', { categoryId: cat.id })
            }
          />
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
        onPress={() => navigation.navigate('AddEditItem', {})}
      >
        <LinearGradient
          colors={['#FF6B9D', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  childBannerText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginBottom: 4,
    marginTop: 8,
  },
  bottomPad: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
