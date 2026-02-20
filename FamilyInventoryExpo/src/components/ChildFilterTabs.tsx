import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Child } from '../types';

interface Props {
  children: Child[];
  selectedId: string; // child id or 'all'
  onSelect: (id: string) => void;
}

export const ChildFilterTabs: React.FC<Props> = ({
  children,
  selectedId,
  onSelect,
}) => {
  const tabs = [{ id: 'all', name: 'みんな', color: '#888', emoji: '🏠' }, ...children];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {tabs.map((tab) => {
          const isSelected = selectedId === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                isSelected && { backgroundColor: tab.color, borderColor: tab.color },
              ]}
              onPress={() => onSelect(tab.id)}
            >
              <Text style={styles.emoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  labelSelected: {
    color: '#fff',
  },
});
