import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList } from '../types';
import { saveImageLocally } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditItem'>;

const ALL_CHILD = 'all';

export const AddEditItemScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId, categoryId: defaultCategoryId } = route.params;
  const { data, addItem, updateItem } = useApp();

  const existingItem = itemId ? data.items.find((i) => i.id === itemId) : null;
  const isEdit = !!existingItem;

  // Form state
  const [name, setName] = useState(existingItem?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    existingItem?.categoryId ?? defaultCategoryId ?? (data.categories[0]?.id ?? ''),
  );
  const [childId, setChildId] = useState(existingItem?.childId ?? ALL_CHILD);
  const [size, setSize] = useState(existingItem?.size ?? '');
  const [brand, setBrand] = useState(existingItem?.brand ?? '');
  const [quantity, setQuantity] = useState(existingItem?.quantity ?? 1);
  const [notes, setNotes] = useState(existingItem?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | null>(existingItem?.imageUri ?? null);
  const [saving, setSaving] = useState(false);

  const sortedCategories = [...data.categories].sort((a, b) => a.order - b.order);
  const childOptions = [
    { id: ALL_CHILD, name: 'みんな（共有）', emoji: '🏠', color: '#888' },
    ...data.children,
  ];

  const selectedCategory = sortedCategories.find((c) => c.id === categoryId);
  const selectedChild = childOptions.find((c) => c.id === childId);

  const pickImage = async () => {
    Alert.alert('写真を選択', '', [
      {
        text: 'カメラで撮影',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('カメラへのアクセスが必要です');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: '写真フォルダから選択',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('写真へのアクセスが必要です');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('アイテム名を入力してください');
      return;
    }
    if (!categoryId) {
      Alert.alert('カテゴリを選択してください');
      return;
    }

    setSaving(true);
    try {
      let finalImageUri = imageUri;
      // Save image locally if it's a temporary URI (from picker)
      if (
        imageUri &&
        !imageUri.includes('inventory_images') &&
        !imageUri.startsWith('http')
      ) {
        finalImageUri = await saveImageLocally(imageUri);
      }

      const itemData = {
        name: name.trim(),
        categoryId,
        childId,
        size: size.trim(),
        brand: brand.trim(),
        quantity,
        notes: notes.trim(),
        imageUri: finalImageUri,
      };

      if (isEdit && itemId) {
        updateItem(itemId, itemData);
      } else {
        addItem(itemData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('保存に失敗しました');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'アイテムを編集' : 'アイテムを追加'}</Text>
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image picker */}
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={36} color="#CCC" />
                <Text style={styles.imagePlaceholderText}>写真を追加</Text>
              </View>
            )}
            {imageUri && (
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </Pressable>

          {/* Name */}
          <FormField label="アイテム名 *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例：ユニクロ ヒートテック"
              placeholderTextColor="#CCC"
            />
          </FormField>

          {/* Category picker */}
          <FormField label="カテゴリ *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {sortedCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.pickerChip,
                    categoryId === cat.id && styles.pickerChipActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={styles.pickerChipEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.pickerChipText,
                      categoryId === cat.id && styles.pickerChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </FormField>

          {/* Child picker */}
          <FormField label="持ち主">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {childOptions.map((child) => (
                <Pressable
                  key={child.id}
                  style={[
                    styles.pickerChip,
                    childId === child.id && [
                      styles.pickerChipActive,
                      { backgroundColor: child.color, borderColor: child.color },
                    ],
                  ]}
                  onPress={() => setChildId(child.id)}
                >
                  <Text style={styles.pickerChipEmoji}>{child.emoji}</Text>
                  <Text
                    style={[
                      styles.pickerChipText,
                      childId === child.id && styles.pickerChipTextActive,
                    ]}
                  >
                    {child.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </FormField>

          {/* Size & Brand row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="サイズ">
                <TextInput
                  style={styles.input}
                  value={size}
                  onChangeText={setSize}
                  placeholder="例：90cm、M"
                  placeholderTextColor="#CCC"
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="ブランド">
                <TextInput
                  style={styles.input}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="例：ユニクロ"
                  placeholderTextColor="#CCC"
                />
              </FormField>
            </View>
          </View>

          {/* Quantity stepper */}
          <FormField label="数量">
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={20} color="#FF6B9D" />
              </Pressable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Ionicons name="add" size={20} color="#FF6B9D" />
              </Pressable>
            </View>
          </FormField>

          {/* Notes */}
          <FormField label="メモ">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="気になること、購入場所など..."
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormField>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
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
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 4,
  },
  imagePicker: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#CCC',
    fontWeight: '600',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 6,
  },
  field: {
    marginVertical: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerRow: {
    marginBottom: 2,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  pickerChipActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  pickerChipEmoji: {
    fontSize: 14,
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pickerChipTextActive: {
    color: '#fff',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  stepperBtn: {
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F5',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
});
