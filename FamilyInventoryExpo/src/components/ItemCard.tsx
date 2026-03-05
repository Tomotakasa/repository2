import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Child, InventoryItem } from '../types';
import { hexToRgba } from '../utils/helpers';

interface Props {
  item: InventoryItem;
  child: Child | null; // null if 'all'
  onPress: () => void;
  onLongPress?: () => void;
}

export const ItemCard: React.FC<Props> = ({
  item,
  child,
  onPress,
  onLongPress,
}) => {
  const accent = child?.color ?? '#B0BEC5';
  const bg = hexToRgba(accent, 0.1);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bg, borderColor: hexToRgba(accent, 0.3) },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Image area */}
      <View style={[styles.imageContainer, { backgroundColor: hexToRgba(accent, 0.15) }]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.image} />
        ) : (
          <Ionicons name="image-outline" size={32} color={hexToRgba(accent, 0.5)} />
        )}
        {/* Child color dot */}
        {child && (
          <View style={[styles.colorDot, { backgroundColor: child.color }]}>
            <Text style={styles.dotEmoji}>{child.emoji}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.size ? (
          <Text style={[styles.tag, { color: accent }]}>{item.size}</Text>
        ) : null}
        {item.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
        <View style={styles.qtyRow}>
          <Ionicons name="cube-outline" size={12} color="#999" />
          <Text style={styles.qty}>{item.quantity}個</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    flex: 1,
    margin: 5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  imageContainer: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  colorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotEmoji: {
    fontSize: 12,
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    lineHeight: 18,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  brand: {
    fontSize: 11,
    color: '#888',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  qty: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
});
