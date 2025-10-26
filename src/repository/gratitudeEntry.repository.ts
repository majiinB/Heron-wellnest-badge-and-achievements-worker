import { LessThan, type Repository } from "typeorm";
import { AppDataSource } from "../config/datasource.config.js";
import type { GratitudeEntry } from "../models/gratitudeEntry.model.js";
import type { EncryptedField } from "../types/encryptedField.type.js";
import { AppError } from "../types/appError.type.js";

/**
 * Repository class for managing GratitudeEntry entities.
 *
 * @description Provides methods to create, retrieve, update, soft delete, hard delete, and count gratitude jar entries.
 * All retrieval methods exclude entries marked as deleted unless explicitly deleted.
 *
 * @remarks
 * - Uses TypeORM's Repository for database operations.
 * - Soft delete sets the `is_deleted` flag to `true` without removing the entry from the database.
 * - Hard delete permanently removes the entry from the database.
 *
 * @example
 * ```typescript
 * const repo = new GratitudeEntryRepository();
 * await repo.createEntry(userId, encryptedContent);
 * const entries = await repo.findByUser(userId);
 * ```
 * 
 * @file gratitudeEntry.repository.ts
 * 
 * @author Arthur M. Artugue
 * @created 2025-09-21
 * @updated 2025-09-22
 */
export class GratitudeEntryRepository {
  private repo: Repository<GratitudeEntry>;

  constructor() {
    // Use the table name string since GratitudeEntry is now an interface
    this.repo = AppDataSource.getRepository<GratitudeEntry>("gratitude_entries");
  }

  /**
   * Checks if a user has made their first gratitude entry (at least one entry exists).
   * Uses raw SQL since we don't own the model.
   *
   * @param user_id - The unique identifier of the user.
   * @returns A promise that resolves to `true` if the user has at least one non-deleted gratitude entry, otherwise `false`.
   */
  async hasFirstEntry(user_id: string): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT EXISTS(
        SELECT 1 
        FROM gratitude_entries 
        WHERE user_id = $1 
        AND is_deleted = false
        LIMIT 1
      ) as "exists"`,
      [user_id]
    );
    return result[0]?.exists ?? false;
  }

  /**
   * Checks if a user has made at least N gratitude entries.
   * Uses raw SQL since we don't own the model.
   *
   * @param user_id - The unique identifier of the user.
   * @param entryCount - The minimum number of entries to check for (e.g., 10, 25, 50, 100).
   * @returns A promise that resolves to `true` if the user has at least the specified number of non-deleted entries, otherwise `false`.
   */
  async hasReachedEntryCount(user_id: string, entryCount: number): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT (COUNT(*) >= $2) as "has_count"
       FROM gratitude_entries
       WHERE user_id = $1 
       AND is_deleted = false`,
      [user_id, entryCount]
    );
    return result[0]?.has_count ?? false;
  }

  /**
   * Checks if a user has made gratitude entries for N consecutive days.
   * Uses raw SQL to count distinct days and verify they form a consecutive sequence.
   * 
   * @param user_id - The unique identifier of the user.
   * @param consecutiveDays - The number of consecutive days to check (e.g., 3, 7, 14, 30).
   * @returns A promise that resolves to `true` if the user has entries for the specified number of consecutive days, otherwise `false`.
   * 
   * @remarks
   * - Multiple entries on the same day count as one day.
   * - Days must be consecutive (no gaps allowed).
   * - Uses UTC date calculation to ensure consistent day boundaries.
   */
  async hasConsecutiveDays(user_id: string, consecutiveDays: number): Promise<boolean> {
    const result = await AppDataSource.query(
      `WITH daily_entries AS (
        SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') as entry_date
        FROM gratitude_entries
        WHERE user_id = $1 
        AND is_deleted = false
        ORDER BY entry_date DESC
      ),
      consecutive_days AS (
        SELECT 
          entry_date,
          entry_date - (ROW_NUMBER() OVER (ORDER BY entry_date))::integer AS grp
        FROM daily_entries
      ),
      streak_lengths AS (
        SELECT 
          COUNT(*) as streak_length,
          MAX(entry_date) as last_date
        FROM consecutive_days
        GROUP BY grp
      )
      SELECT EXISTS(
        SELECT 1 
        FROM streak_lengths 
        WHERE streak_length >= $2
      ) as "exists"`,
      [user_id, consecutiveDays]
    );
    return result[0]?.exists ?? false;
  }
}