import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Label } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LabelsScreen() {
  const { labels, transactions, loading, refreshData, deleteLabel } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const handleDelete = async (label: Label) => {
    // Check if label is used in transactions
    const isUsed = transactions.some((t) => t.labels?.includes(label.id));
    
    if (isUsed) {
      Alert.alert(
        'Cannot Delete',
        'This label is being used in transactions. Please remove it from all transactions first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Label',
      `Are you sure you want to delete "${label.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteLabel(label.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete label');
            }
          },
        },
      ]
    );
  };

  const renderLabelItem = (label: Label) => (
    <TouchableOpacity
      key={label.id}
      style={[styles.labelItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/labels/add?id=${label.id}`);
      }}>
      <View style={styles.labelItemContent}>
        <View style={[styles.labelColorDot, { backgroundColor: label.color }]} />
        <View style={styles.labelInfo}>
          <ThemedText type="defaultSemiBold" style={[styles.labelName, { color: colors.text }]}>
            {label.name}
          </ThemedText>
        </View>
        <View style={styles.labelActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/labels/add?id=${label.id}`);
            }}
            style={styles.actionIcon}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label.name}`}
            accessibilityHint="Opens the edit form for this label">
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(label);
            }}
            style={styles.actionIcon}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${label.name}`}
            accessibilityHint="Deletes this label">
            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
          </TouchableOpacity>
          <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Labels</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your transaction labels
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/labels/add');
          }}
          style={styles.addButton}
          activeOpacity={0.7}>
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }>
        {labels.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="label" size={64} color={colors.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No labels found
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create your first label to get started
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {labels.map(renderLabelItem)}
          </View>
        )}
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
  },
  labelItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  labelItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelColorDot: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  labelInfo: {
    flex: 1,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginTop: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },
});
