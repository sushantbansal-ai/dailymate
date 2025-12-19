import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ContactService from '@/services/contacts';
import { Contact } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Platform, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactsScreen() {
  const { contacts, transactions, loading, refreshData, deleteContact, addContact } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState(false);

  const handleDelete = async (contact: Contact) => {
    // Check if contact is used in transactions
    const isUsed = transactions.some((t) => t.payeeId === contact.id);
    
    if (isUsed) {
      Alert.alert(
        'Cannot Delete',
        'This contact is being used in transactions. Please remove it from all transactions first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete "${contact.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteContact(contact.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleSyncContacts = async () => {
    try {
      setSyncing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check permission status first to provide better UX
      const permissionStatus = await ContactService.getContactsPermissionStatus();
      
      // If permission was previously denied, guide user to settings
      if (permissionStatus === 'denied') {
        Alert.alert(
          'Permission Required',
          'Contacts permission was previously denied. To sync contacts, please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSyncing(false) },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                try {
                  if (Platform.OS === 'ios') {
                    await Linking.openURL('app-settings:');
                  } else {
                    await Linking.openSettings();
                  }
                } catch (error) {
                  // Fallback message if can't open settings
                  Alert.alert(
                    'Enable Contacts',
                    'Go to Settings > DailyMate > Contacts and enable access, then try syncing again.',
                    [{ text: 'OK', onPress: () => setSyncing(false) }]
                  );
                }
              }
            }
          ]
        );
        return;
      }
      
      // Try to sync - the service will request permission if needed
      const deviceContacts = await ContactService.syncDeviceContacts();
      
      // Check for duplicates and add new contacts
      const existingContactIds = new Set(contacts.map((c) => c.id));
      const existingPhoneNumbers = new Set(
        contacts
          .map((c) => c.phoneNumber)
          .filter((p): p is string => !!p)
      );
      const existingEmails = new Set(
        contacts
          .map((c) => c.email)
          .filter((e): e is string => !!e)
      );

      let addedCount = 0;
      let skippedCount = 0;

      for (const deviceContact of deviceContacts) {
        // Skip if already exists by ID, phone, or email
        if (
          existingContactIds.has(deviceContact.id) ||
          (deviceContact.phoneNumber && existingPhoneNumbers.has(deviceContact.phoneNumber)) ||
          (deviceContact.email && existingEmails.has(deviceContact.email))
        ) {
          skippedCount++;
          continue;
        }

        await addContact(deviceContact);
        addedCount++;
      }

      Alert.alert(
        'Sync Complete',
        `Added ${addedCount} new contact${addedCount !== 1 ? 's' : ''}. ${skippedCount} duplicate${skippedCount !== 1 ? 's' : ''} skipped.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sync contacts';
      
      // Provide more helpful error messages
      if (errorMessage.includes('permission')) {
        Alert.alert(
          'Permission Required',
          errorMessage + '\n\nIf you denied permission before, please enable it in Settings > DailyMate > Contacts',
          [
            { text: 'OK' },
            {
              text: 'Try Again',
              onPress: () => {
                // Retry after a short delay
                setTimeout(() => handleSyncContacts(), 500);
              }
            }
          ]
        );
      } else {
        Alert.alert('Sync Failed', errorMessage);
      }
    } finally {
      setSyncing(false);
    }
  };

  const renderContactItem = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      style={[styles.contactItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/contacts/add?id=${contact.id}`);
      }}>
      <View style={styles.contactItemContent}>
        <View style={[styles.contactAvatar, { backgroundColor: colors.primary + '20' }]}>
          <ThemedText style={[styles.contactAvatarText, { color: colors.primary }]}>
            {contact.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.contactInfo}>
          <ThemedText type="defaultSemiBold" style={[styles.contactName, { color: colors.text }]}>
            {contact.name}
          </ThemedText>
          {contact.phoneNumber && (
            <ThemedText style={[styles.contactPhone, { color: colors.textSecondary }]}>
              {contact.phoneNumber}
            </ThemedText>
          )}
          {contact.email && (
            <ThemedText style={[styles.contactEmail, { color: colors.textSecondary }]}>
              {contact.email}
            </ThemedText>
          )}
        </View>
        <View style={styles.contactActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/contacts/add?id=${contact.id}`);
            }}
            style={styles.actionIcon}
            activeOpacity={0.7}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(contact);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.iconActive || colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Contacts</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your contacts
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/contacts/add');
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
        {/* Sync Button */}
        <Button
          title={syncing ? 'Syncing...' : 'Sync from Device'}
          onPress={handleSyncContacts}
          variant="secondary"
          disabled={syncing}
          loading={syncing}
          style={styles.syncButton}
          icon={syncing ? undefined : <MaterialIcons name="sync" size={20} color={colors.primary} />}
        />

        {contacts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <MaterialIcons name="contacts" size={64} color={colors.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No contacts found
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Add contacts or sync from device
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {contacts.map(renderContactItem)}
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
  syncButton: {
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
  },
  contactItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  contactItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
  },
  contactActions: {
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
