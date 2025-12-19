import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Label } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Predefined colors for labels
const LABEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3A5', '#C7CEEA',
  '#6BCB77', '#4D96FF', '#9B59B6', '#E74C3C', '#3498DB',
  '#1ABC9C', '#F39C12', '#E67E22', '#34495E', '#16A085',
];

export default function AddLabelScreen() {
  const { labels, addLabel, updateLabel } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  
  const editingLabel = params.id ? labels.find((l) => l.id === params.id) : null;

  const [name, setName] = useState(editingLabel?.name || '');
  const [color, setColor] = useState(editingLabel?.color || LABEL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter label name';
    if (!color) newErrors.color = 'Please select a color';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const labelData: Label = {
      id: editingLabel?.id || Date.now().toString(),
      name: name.trim(),
      color,
      createdAt: editingLabel?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingLabel) {
        await updateLabel(labelData);
      } else {
        await addLabel(labelData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save label. Please try again.',
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
            {editingLabel ? 'Edit Label' : 'Add Label'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        
        {/* Label Name */}
        <Input
          label="Label Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Business, Personal, Tax"
          error={errors.name}
        />

        {/* Color Selection */}
        <ColorPicker
          colors={LABEL_COLORS}
          selectedColor={color}
          onColorSelect={setColor}
          label="Color"
        />

        <Button
          title={editingLabel ? 'Update Label' : 'Create Label'}
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
  submitButton: {
    marginTop: Spacing.md,
  },
});
