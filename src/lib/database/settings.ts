
import { getDB } from './connection';
import { AppSettings, AppSettingsRecord } from './types';

export class SettingsDB {
  static async get(): Promise<AppSettings> {
    try {
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      if (settings) {
        // Return without the id property
        const { id, ...appSettings } = settings;
        return appSettings;
      }
      return {
        theme: 'light',
        autoLogout: 30,
        requireFingerprint: true,
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };
    } catch (error) {
      console.error('Failed to get settings from IndexedDB:', error);
      return {
        theme: 'light',
        autoLogout: 30,
        requireFingerprint: true,
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };
    }
  }

  static async update(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const db = await getDB();
      const current = await this.get();
      const updated = { ...current, ...settings };
      const settingsRecord: AppSettingsRecord = { id: 'app-settings', ...updated };
      await db.put('settings', settingsRecord);
      console.log('Settings updated in IndexedDB');
      return updated;
    } catch (error) {
      console.error('Failed to update settings in IndexedDB:', error);
      throw new Error('Failed to update settings');
    }
  }
}
