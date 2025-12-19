/**
 * Contact Sync Service
 * Handles syncing contacts from device contacts
 */

import { Contact } from '@/types';

// Lazy load expo-contacts to handle cases where it might not be available
let ContactsModule: typeof import('expo-contacts') | null = null;

const getContactsModule = (): typeof import('expo-contacts') | null => {
  if (ContactsModule) return ContactsModule;
  try {
    ContactsModule = require('expo-contacts');
    return ContactsModule;
  } catch (e) {
    console.warn('expo-contacts not available:', e);
    return null;
  }
};

/**
 * Request contacts permission
 * Returns: { granted: boolean, canAskAgain: boolean, status: string }
 */
export async function requestContactsPermission(): Promise<{ granted: boolean; canAskAgain: boolean; status: string }> {
  const Contacts = getContactsModule();
  if (!Contacts) {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }

  try {
    // First check current permission status
    const currentStatus = await Contacts.getPermissionsAsync();
    
    // If already granted, return success
    if (currentStatus.status === 'granted') {
      return { granted: true, canAskAgain: true, status: 'granted' };
    }

    // If denied and can't ask again (iOS), return that info
    if (currentStatus.status === 'denied' && currentStatus.canAskAgain === false) {
      return { granted: false, canAskAgain: false, status: 'denied' };
    }

    // If undetermined or can ask again, request permission (will show popup)
    // Note: On iOS, if previously denied, requestPermissionsAsync won't show popup
    // On Android, it will show popup even if previously denied
    const requestResult = await Contacts.requestPermissionsAsync();
    
    return { 
      granted: requestResult.status === 'granted', 
      canAskAgain: requestResult.canAskAgain ?? true, 
      status: requestResult.status 
    };
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return { granted: false, canAskAgain: false, status: 'error' };
  }
}

/**
 * Get contacts permission status
 */
export async function getContactsPermissionStatus(): Promise<string> {
  const Contacts = getContactsModule();
  if (!Contacts) return 'unavailable';

  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error getting contacts permission:', error);
    return 'unavailable';
  }
}

/**
 * Sync contacts from device
 * Returns array of Contact objects
 */
export async function syncDeviceContacts(): Promise<Contact[]> {
  const Contacts = getContactsModule();
  if (!Contacts) {
    throw new Error('Contacts module is not available. Please install expo-contacts.');
  }

  // Request permission
  const permissionResult = await requestContactsPermission();
  
  if (!permissionResult.granted) {
    if (!permissionResult.canAskAgain) {
      throw new Error('Contacts permission was denied. Please enable it in your device settings: Settings > DailyMate > Contacts');
    } else {
      throw new Error('Contacts permission is required to sync contacts. Please grant permission when prompted.');
    }
  }

  try {
    // Fetch contacts
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
    });

    // Convert to app Contact format
    const syncedContacts: Contact[] = data
      .filter((contact) => contact.name) // Only contacts with names
      .map((contact) => {
        const phoneNumber = contact.phoneNumbers?.[0]?.number;
        const email = contact.emails?.[0]?.email;

        return {
          id: contact.id || `contact_${Date.now()}_${Math.random()}`,
          name: contact.name || 'Unknown',
          phoneNumber: phoneNumber || undefined,
          email: email || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

    return syncedContacts;
  } catch (error: any) {
    console.error('Error syncing contacts:', error);
    throw new Error(error.message || 'Failed to sync contacts');
  }
}
