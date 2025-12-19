import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Contact } from '@/types';
import { getScrollViewBottomPadding } from '@/utils/constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddContactScreen() {
  const { contacts, addContact, updateContact } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] || Colors.light;
  const insets = useSafeAreaInsets();
  
  const editingContact = params.id ? contacts.find((c) => c.id === params.id) : null;

  const [name, setName] = useState(editingContact?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(editingContact?.phoneNumber || '');
  const [email, setEmail] = useState(editingContact?.email || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter contact name';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const contactData: Contact = {
      id: editingContact?.id || Date.now().toString(),
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      createdAt: editingContact?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingContact) {
        await updateContact(contactData);
      } else {
        await addContact(contactData);
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to save contact. Please try again.',
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
            {editingContact ? 'Edit Contact' : 'Add Contact'}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: getScrollViewBottomPadding(insets.bottom) }]}>
        
        {/* Contact Name */}
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., John Doe"
          error={errors.name}
        />

        {/* Phone Number */}
        <Input
          label="Phone Number (Optional)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="e.g., +1 234 567 8900"
          keyboardType="phone-pad"
        />

        {/* Email */}
        <Input
          label="Email (Optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="e.g., john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Button
          title={editingContact ? 'Update Contact' : 'Create Contact'}
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
