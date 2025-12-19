import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Predefined colors for categories
const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C', '#3498DB',
  '#1ABC9C', '#F39C12', '#E67E22', '#34495E', '#16A085',
];

export default function AddCategoryScreen() {
  const { categories, addCategory, updateCategory } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  
  const editingCategory = params.id ? categories.find((c) => c.id === params.id) : null;

  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState<'income' | 'expense'>(editingCategory?.type || 'expense');
  const [icon, setIcon] = useState(editingCategory?.icon || '💰');
  const [color, setColor] = useState(editingCategory?.color || CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter category name';
    if (!icon.trim()) newErrors.icon = 'Please enter an emoji icon';
    if (!color) newErrors.color = 'Please select a color';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const categoryData: Category = {
      id: editingCategory?.id || Date.now().toString(),
      name: name.trim(),
      type,
      icon: icon.trim(),
      color,
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingCategory) {
        await updateCategory(categoryData);
      } else {
        await addCategory(categoryData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save category. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        
        {/* Category Name */}
        <Input
          label="Category Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Groceries"
          error={errors.name}
        />

        {/* Category Type */}
        <Select
          label="Type"
          value={type}
          options={[
            { label: '💰 Income', value: 'income' },
            { label: '💸 Expense', value: 'expense' },
          ]}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setType(value as 'income' | 'expense');
          }}
          placeholder="Select type"
          error={errors.type}
        />

        {/* Icon (Emoji) */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
            Icon (Emoji)
          </ThemedText>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => {
                // In a real app, you'd open an emoji picker here
              }}
              activeOpacity={0.7}>
              <ThemedText style={styles.iconDisplay}>{icon}</ThemedText>
            </TouchableOpacity>
            <Input
              value={icon}
              onChangeText={(text) => {
                // Allow only emoji characters (basic validation)
                if (text.length <= 2) {
                  setIcon(text);
                }
              }}
              placeholder="Enter emoji"
              style={styles.iconInput}
              maxLength={2}
            />
          </View>
          <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
            Use an emoji to represent this category
          </ThemedText>
        </View>

        {/* Color Selection */}
        <ColorPicker
          colors={CATEGORY_COLORS}
          selectedColor={color}
          onColorSelect={setColor}
          label="Color"
        />

        <Button
          title={editingCategory ? 'Update Category' : 'Create Category'}
          onPress={handleSubmit}
          variant="primary"
          style={styles.submitButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconDisplay: {
    fontSize: 32,
  },
  iconInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
