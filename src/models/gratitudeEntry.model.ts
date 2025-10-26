import type { EncryptedField } from "../types/encryptedField.type.js";

/**
 * @file gratitudeEntry.model.ts
 * 
 * @description Gratitude jar entry model for the Heron Wellnest Activities API.
 * 
 * @author Arthur M. Artugue
 * @created 2025-09-21
 * @updated 2025-10-02
 */

export interface GratitudeEntry {
  gratitude_id: string;
  user_id: string;
  content_encrypted: EncryptedField;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}