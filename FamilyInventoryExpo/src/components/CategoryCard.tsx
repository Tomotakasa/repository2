import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

interface Props {
  category: Category;
  count: number;
  totalQty: number;
  onPress: () => void;
}

export const CategoryCard: React.FC<Props> = ({
  category,
  count,
  totalQty,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{category.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{category.name}</Text>
          <Text style={styles.sub}>
            {count === 0 ? 'アイテムなし' : `${count}種類 · 合計${totalQty}個`}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalQty}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color="#CCC" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    color: '#999',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});
