import type { EncryptedField } from "../types/encryptedField.type.js";

/**
 * @file journalEntry.model.ts
 * 
 * @description Journal entry model for the Heron Wellnest Activities API.
 * 
 * @author Arthur M. Artugue
 * @created 2025-09-21
 * @updated 2025-09-25
 */

export interface JournalEntry {
  journal_id: string;
  user_id: string;
  title_encrypted: EncryptedField;
  content_encrypted: EncryptedField;
  wellness_state: Record<string, number> | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}