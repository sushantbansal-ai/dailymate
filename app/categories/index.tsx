import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  const { categories, transactions, loading, refreshData, deleteCategory } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();

  const handleDelete = async (category: Category) => {
    // Check if category is used in transactions
    const isUsed = transactions.some((t) => t.categoryId === category.id);
    
    if (isUsed) {
      Alert.alert(
        'Cannot Delete',
        'This category is being used in transactions. Please remove it from all transactions first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteCategory(category.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/categories/add?id=${category.id}`);
      }}>
      <View style={styles.categoryItemContent}>
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
          <ThemedText style={styles.categoryIcon}>{category.icon}</ThemedText>
        </View>
        <View style={styles.categoryInfo}>
          <ThemedText type="defaultSemiBold" style={[styles.categoryName, { color: colors.text }]}>
            {category.name}
          </ThemedText>
          <View style={styles.categoryMeta}>
            <View style={[styles.categoryTypeBadge, { 
              backgroundColor: category.type === 'income' ? colors.income + '20' : colors.expense + '20'
            }]}>
              <ThemedText style={[styles.categoryTypeText, { 
                color: category.type === 'income' ? colors.income : colors.expense 
              }]}>
                {category.type === 'income' ? 'Income' : 'Expense'}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.categoryActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/categories/add?id=${category.id}`);
            }}
            style={styles.actionIcon}
            activeOpacity={0.7}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(category);
            }}
            style={styles.actionIcon}
            activeOpacity={0.7}>
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
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen">
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Transaction Categories</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your categories
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/categories/add');
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
        {categories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="category" size={64} color={colors.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No categories found
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create your first category to get started
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {categories.map(renderCategoryItem)}
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
  categoryItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  categoryTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryActions: {
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
