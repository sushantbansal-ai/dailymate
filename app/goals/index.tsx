import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Goal } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const { goals, accounts, loading, refreshData, deleteGoal } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Calculate progress for each goal
  const goalsWithProgress = useMemo(() => {
    return goals.map((goal) => {
      // If goal is linked to an account, use account balance
      let currentAmount = goal.currentAmount;
      if (goal.accountId) {
        const account = accounts.find((a) => a.id === goal.accountId);
        if (account) {
          currentAmount = account.balance;
        }
      }

      const percentage = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = goal.targetAmount - currentAmount;
      const isCompleted = currentAmount >= goal.targetAmount;
      const targetDate = new Date(goal.targetDate);
      const today = new Date();
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysRemaining < 0 && !isCompleted;
      const linkedAccount = goal.accountId ? accounts.find((a) => a.id === goal.accountId) : null;

      return {
        ...goal,
        currentAmount,
        percentage: Math.min(percentage, 100),
        remaining,
        isCompleted,
        daysRemaining,
        isOverdue,
        linkedAccount,
      };
    });
  }, [goals, accounts]);

  const handleDelete = async (goal: Goal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const getProgressColor = (percentage: number, isCompleted: boolean, isOverdue: boolean) => {
    if (isCompleted) return colors.success;
    if (isOverdue) return colors.error;
    if (percentage >= 90) return colors.success;
    if (percentage >= 75) return colors.info;
    if (percentage >= 50) return colors.warning;
    return colors.primary;
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[Typography.h1, { color: colors.text }]}>Goals</ThemedText>
          <ThemedText style={[Typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
            Track your savings goals
          </ThemedText>
        </View>
        <Button
          title="+ Add"
          onPress={() => router.push('/goals/add')}
          variant="primary"
          size="small"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} />}>
        {goalsWithProgress.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="track-changes" size={64} color={colors.textTertiary} />
            <ThemedText style={[Typography.h3, styles.emptyText, { color: colors.text }]}>
              No Goals Found
            </ThemedText>
            <ThemedText style={[Typography.bodyMedium, styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first savings goal to start tracking!
            </ThemedText>
            <Button
              title="Create Goal"
              onPress={() => router.push('/goals/add')}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          goalsWithProgress.map((goal) => {
            const progressColor = getProgressColor(goal.percentage, goal.isCompleted, goal.isOverdue);

            return (
              <Card key={goal.id} variant="default" padding="lg" style={styles.goalCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/goals/add?id=${goal.id}`)}
                  activeOpacity={0.7}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                        <ThemedText style={styles.goalIconText}>{goal.icon || '🎯'}</ThemedText>
                      </View>
                      <View style={styles.goalDetails}>
                        <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                          {goal.name}
                        </ThemedText>
                        {goal.description && (
                          <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                            {goal.description}
                          </ThemedText>
                        )}
                        {goal.linkedAccount && (
                          <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>
                            Linked: {goal.linkedAccount.name}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/goals/add?id=${goal.id}`);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="edit" size={ComponentSizes.iconMedium} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(goal);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <MaterialIcons name="delete-outline" size={ComponentSizes.iconMedium} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${goal.percentage}%`,
                            backgroundColor: progressColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressInfo}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                        {goal.percentage.toFixed(1)}% complete
                      </ThemedText>
                      {goal.isCompleted ? (
                        <ThemedText style={[Typography.bodySmall, { color: colors.success }]}>
                          ✓ Completed!
                        </ThemedText>
                      ) : goal.isOverdue ? (
                        <ThemedText style={[Typography.bodySmall, { color: colors.error }]}>
                          Overdue
                        </ThemedText>
                      ) : (
                        <ThemedText style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                          {goal.daysRemaining} days left
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {/* Amount Info */}
                  <View style={styles.amountInfo}>
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Saved</ThemedText>
                      <ThemedText style={[Typography.bodyLarge, { color: colors.success, fontWeight: '600' }]}>
                        ₹{goal.currentAmount.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Target</ThemedText>
                      <ThemedText style={[Typography.bodyLarge, { color: colors.text, fontWeight: '600' }]}>
                        ₹{goal.targetAmount.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountItem}>
                      <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary }]}>Remaining</ThemedText>
                      <ThemedText
                        style={[
                          Typography.bodyLarge,
                          { color: goal.remaining > 0 ? colors.text : colors.success, fontWeight: '600' },
                        ]}>
                        ₹{Math.max(0, goal.remaining).toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Target Date */}
                  <View style={styles.dateInfo}>
                    <MaterialIcons name="calendar-today" size={16} color={colors.textTertiary} />
                    <ThemedText style={[Typography.bodySmall, { color: colors.textTertiary, marginLeft: Spacing.xs }]}>
                      Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  goalCard: {
    marginBottom: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  goalIconText: {
    fontSize: 24,
  },
  goalDetails: {
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    minHeight: ComponentSizes.minTouchTarget,
    minWidth: ComponentSizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.sm,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Spacing.xs,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  emptyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    marginTop: Spacing.xl,
    ...Shadows.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
});
