
import { Staff } from '@/lib/database/types';
import { StaffDB } from '@/lib/database';

interface FingerprintTemplate {
  staffId: string;
  template: string;
  enrolledAt: Date;
}

export class FingerprintMatcher {
  private static templates: Map<string, FingerprintTemplate> = new Map();
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔍 Initializing fingerprint matcher...');
      await this.loadStoredTemplates();
      this.initialized = true;
      console.log('✅ Fingerprint matcher initialized');
    } catch (error) {
      console.error('❌ Failed to initialize fingerprint matcher:', error);
    }
  }

  private static async loadStoredTemplates(): Promise<void> {
    try {
      const staff = await StaffDB.getAll();
      this.templates.clear();
      
      staff.forEach(member => {
        if (member.fingerprintId) {
          this.templates.set(member.id, {
            staffId: member.id,
            template: member.fingerprintId,
            enrolledAt: member.createdAt
          });
        }
      });
      
      console.log('📋 Loaded fingerprint templates for', this.templates.size, 'staff members');
    } catch (error) {
      console.error('Failed to load fingerprint templates:', error);
    }
  }

  static async enrollFingerprint(staffId: string, template: string): Promise<boolean> {
    try {
      // Store the template
      this.templates.set(staffId, {
        staffId,
        template,
        enrolledAt: new Date()
      });

      // Update staff record
      await StaffDB.update(staffId, { fingerprintId: template });
      
      console.log('✅ Fingerprint enrolled for staff:', staffId);
      return true;
    } catch (error) {
      console.error('❌ Failed to enroll fingerprint:', error);
      return false;
    }
  }

  static async matchFingerprint(template: string): Promise<Staff | null> {
    try {
      // Simple template matching (in production, use proper biometric algorithms)
      for (const [staffId, stored] of this.templates) {
        const similarity = this.calculateSimilarity(template, stored.template);
        
        if (similarity > 0.7) { // 70% similarity threshold
          console.log('✅ Fingerprint match found for staff:', staffId, 'similarity:', similarity);
          return await StaffDB.getById(staffId);
        }
      }
      
      console.log('❌ No fingerprint match found');
      return null;
    } catch (error) {
      console.error('❌ Error matching fingerprint:', error);
      return null;
    }
  }

  private static calculateSimilarity(template1: string, template2: string): number {
    // Simple similarity calculation (replace with proper biometric matching in production)
    if (template1 === template2) return 1.0;
    
    const len = Math.min(template1.length, template2.length);
    let matches = 0;
    
    for (let i = 0; i < len; i++) {
      if (template1[i] === template2[i]) {
        matches++;
      }
    }
    
    return matches / Math.max(template1.length, template2.length);
  }

  static async removeFingerprint(staffId: string): Promise<boolean> {
    try {
      this.templates.delete(staffId);
      await StaffDB.update(staffId, { fingerprintId: undefined });
      console.log('✅ Fingerprint removed for staff:', staffId);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove fingerprint:', error);
      return false;
    }
  }

  static getEnrolledCount(): number {
    return this.templates.size;
  }

  static isEnrolled(staffId: string): boolean {
    return this.templates.has(staffId);
  }
}
