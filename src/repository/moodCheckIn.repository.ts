import { Between, type Repository } from "typeorm";
import { fromZonedTime } from "date-fns-tz";
import { AppDataSource } from "../config/datasource.config.js";
import type { MoodCheckIn } from "../models/moodCheckIn.model.js";

export class MoodCheckInRepository {
  private repo: Repository<MoodCheckIn>;

  constructor() {
    // Use the table name string since MoodCheckIn is now an interface
    this.repo = AppDataSource.getRepository<MoodCheckIn>("mood_check_ins");
  }

  /**
   * Checks if a user has logged mood check-ins for N consecutive days.
   * Uses raw SQL to count distinct days and verify they form a consecutive sequence.
   * 
   * @param user_id - The unique identifier of the user.
   * @param consecutiveDays - The number of consecutive days to check (e.g., 3, 7, 14, 30).
   * @returns A promise that resolves to `true` if the user has check-ins for the specified number of consecutive days, otherwise `false`.
   * 
   * @remarks
   * - Multiple check-ins on the same day count as one day.
   * - Days must be consecutive (no gaps allowed).
   * - Uses UTC date calculation to ensure consistent day boundaries.
   */
  public async hasConsecutiveDays(user_id: string, consecutiveDays: number): Promise<boolean> {
    const result = await AppDataSource.query(
      `WITH daily_checkins AS (
        SELECT DISTINCT DATE(checked_in_at AT TIME ZONE 'UTC') as checkin_date
        FROM mood_check_ins
        WHERE user_id = $1
        ORDER BY checkin_date DESC
      ),
      consecutive_days AS (
        SELECT 
          checkin_date,
          checkin_date - (ROW_NUMBER() OVER (ORDER BY checkin_date))::integer AS grp
        FROM daily_checkins
      ),
      streak_lengths AS (
        SELECT 
          COUNT(*) as streak_length,
          MAX(checkin_date) as last_date
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