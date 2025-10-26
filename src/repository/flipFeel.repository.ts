import { Repository } from "typeorm";
import { AppDataSource } from "../config/datasource.config.js";
import type { FlipFeel } from "../models/flipFeel.model.js";
import { FlipFeelResponse } from "../models/flipFeelResponse.model.js";
import { FlipFeelQuestions } from "../models/flipFeelQuestions.model.js";
import { FlipFeelChoice } from "../models/flipFeelChoices.model.js";

export interface ResponseInput {
  question_id: string;
  choice_id: string;
}

/**
 * Repository for managing flip and feel sessions and responses.
 * 
 * @description Handles creation and retrieval of flip and feel sessions with their responses.
 * A session represents a single attempt of answering questions, with multiple responses linked to it.
 */
export class FlipFeelRepository {
  private sessionRepo: Repository<FlipFeel>;
  private responseRepo: Repository<FlipFeelResponse>;

  constructor() {
    // Use the table name string since FlipFeel is now an interface
    this.sessionRepo = AppDataSource.getRepository<FlipFeel>("flip_feel");
    this.responseRepo = AppDataSource.getRepository(FlipFeelResponse);
  }

  /**
   * Checks if a user has completed their first flip and feel session.
   * Uses raw SQL since we don't own the model.
   *
   * @param user_id - The unique identifier of the user.
   * @returns A promise that resolves to `true` if the user has at least one completed session, otherwise `false`.
   */
  async hasFirstEntry(user_id: string): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT EXISTS(
        SELECT 1 
        FROM flip_feel 
        WHERE user_id = $1 
        AND finished_at IS NOT NULL
        LIMIT 1
      ) as "exists"`,
      [user_id]
    );
    return result[0]?.exists ?? false;
  }

  /**
   * Checks if a user has answered flip and feel questions from every category.
   * Uses raw SQL to verify that the user has completed sessions covering all 7 categories.
   * 
   * @param user_id - The unique identifier of the user.
   * @param validCategories - Array of all valid category names to check against.
   * @returns A promise that resolves to `true` if the user has answered questions from all categories, otherwise `false`.
   * 
   * @remarks
   * Categories: ["school", "opposite_sex", "peers", "family", "crises", "emotions", "recreation"]
   * Only counts completed sessions (finished_at IS NOT NULL).
   */
  async hasCompletedAllCategories(user_id: string, validCategories: string[]): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT 
        (COUNT(DISTINCT q.category) >= $2) as "has_all_categories"
       FROM flip_feel f
       INNER JOIN flip_feel_responses r ON f.flip_feel_id = r.flip_feel_id
       INNER JOIN flip_feel_questions q ON r.question_id = q.question_id
       WHERE f.user_id = $1
       AND f.finished_at IS NOT NULL
       AND q.category = ANY($3::text[])`,
      [user_id, validCategories.length, validCategories]
    );
    return result[0]?.has_all_categories ?? false;
  }

  /**
   * Checks if a user has completed N flip and feel sessions on consecutive days.
   * Uses raw SQL to count distinct days and verify they form a consecutive sequence.
   * 
   * @param user_id - The unique identifier of the user.
   * @param consecutiveDays - The number of consecutive days to check (e.g., 3, 7, 14, 30).
   * @returns A promise that resolves to `true` if the user has completed sessions for the specified number of consecutive days, otherwise `false`.
   * 
   * @remarks
   * - Multiple sessions on the same day count as one day.
   * - Days must be consecutive (no gaps allowed).
   * - Uses UTC date calculation to ensure consistent day boundaries.
   * - Only counts completed sessions (finished_at IS NOT NULL).
   */
  async hasConsecutiveDays(user_id: string, consecutiveDays: number): Promise<boolean> {
    const result = await AppDataSource.query(
      `WITH daily_sessions AS (
        SELECT DISTINCT DATE(finished_at AT TIME ZONE 'UTC') as session_date
        FROM flip_feel
        WHERE user_id = $1 
        AND finished_at IS NOT NULL
        ORDER BY session_date DESC
      ),
      consecutive_days AS (
        SELECT 
          session_date,
          session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::integer AS grp
        FROM daily_sessions
      ),
      streak_lengths AS (
        SELECT 
          COUNT(*) as streak_length,
          MAX(session_date) as last_date
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