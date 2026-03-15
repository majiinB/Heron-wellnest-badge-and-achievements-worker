import { env } from "../config/env.config.js";
import type { BadgesRepository } from "../repository/badges.repository.js";
import type { FlipFeelRepository } from "../repository/flipFeel.repository.js";
import type { GratitudeEntryRepository } from "../repository/gratitudeEntry.repository.js";
import type { JournalEntryRepository } from "../repository/journalEntry.repository.js";
import type { MoodCheckInRepository } from "../repository/moodCheckIn.repository.js";
import { publishMessage } from "../utils/pubsub.util.js";

export type CategoryEnum = "school" | "opposite_sex" | "peers" | "family" | "crises" | "emotions" | "recreation";

/**
 * Service class for managing Journal entries.
 *
 * @description Provides methods to create, retrieve, update, and delete journal entries.
 * Handles content encryption/decryption before interacting with the repository layer.
 *
 * @remarks
 * - Content is encrypted before storage and decrypted when retrieved.
 * - Soft delete marks an entry as deleted without removing it from the database.
 * - Hard delete permanently removes the entry.
 * - Supports pagination-like retrieval using `lastEntryId`.
 * - Encryption key is loaded from environment variables via `env.CONTENT_ENCRYPTION_KEY`.
 *
 * @example
 * ```typescript
 * const service = new BadgeWorkerService(journalRepo);
 * await service.createEntry(userId, "My private journal entry");
 * const entries = await service.getEntriesByUser(userId, 10);
 * ```
 *
 * @file journal.service.ts
 * 
 * @author Arthur M. Artugue
 * @created 2025-09-21
 * @updated 2025-09-25
 */
export class BadgeWorkerService {
  private journalRepo : JournalEntryRepository;
  private flipFeelRepo : FlipFeelRepository;
  private gratitudeRepo : GratitudeEntryRepository;
  private moodRepo: MoodCheckInRepository;
  private badgesRepo : BadgesRepository;
  private badges : Record<string, string> = {
    JOURNAL_FIRST_ENTRY: "New Beginnings",
    JOURNAL_3_STREAK: "Mindful Momentum",
    JOURNAL_7_STREAK: "Mind Gardener",
    JOURNAL_10_ENTRIES: "Voice of Reflection",
    JOURNAL_20_ENTRIES: "Journey Within",
    JOURNAL_30_ENTRIES: "Keeper of Insight",
    FLIP_AND_FEEL_FIRST: "First Step Inward",
    FLIP_AND_FEEL_ALL_CATEGORIES: "Emotional Explorer",
    FLIP_AND_FEEL_7_STREAK: "Steady Self-Reflector",
    GRATITUDE_FIRST_ENTRY: "Grateful Heart",
    GRATITUDE_10_ENTRIES: "Growing Gratitude",
    GRATITUDE_25_ENTRIES: "Mindful Appreciator",
    GRATITUDE_50_ENTRIES: "Beacon of Gratitude",
    GRATITUDE_100_ENTRIES: "Radiant Gratitude",
    GRATITUDE_3_STREAK: "Thankful Thinker",
    GRATITUDE_7_STREAK: "Appreciation Advocate",
    MOOD_CHECKIN_7_STREAK: "Steady Observer",
    MOOD_CHECKIN_14_STREAK: "Balanced Mind Keeper"
  };


  /**
   * Creates an instance of the BadgeWorkerService.
   * 
   * @param journalRepo - The repository used for accessing and managing journal entries.
   * 
   * Initializes the journal repository and sets the encryption key from environment variables.
   */
  constructor(journalRepo : JournalEntryRepository, 
    flipFeelRepo : FlipFeelRepository, 
    gratitudeRepo : GratitudeEntryRepository, 
    moodRepo : MoodCheckInRepository,
    badgesRepo : BadgesRepository
  ) {
    this.journalRepo = journalRepo;
    this.flipFeelRepo = flipFeelRepo;
    this.gratitudeRepo = gratitudeRepo;
    this.moodRepo = moodRepo;
    this.badgesRepo = badgesRepo;
  }

  public async journalBadgeWorker(userId: string): Promise<void> {
    try {
      // Get all user badges once for efficiency
      const userBadges = await this.badgesRepo.getUserBadges(userId);
      const badgeNames = new Set(userBadges.map(b => b.badge_name));

      // Check first entry badge
      if (!badgeNames.has(this.badges.JOURNAL_FIRST_ENTRY)) {
        if (await this.journalRepo.hasFirstEntry(userId)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_FIRST_ENTRY);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_FIRST_ENTRY}!`,
            content: "Congratulations on writing your first journal entry! This badge marks the start of your mindfulness journey. Keep it up to earn more badges and deepen your self-reflection practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 3-day streak badge
      if (!badgeNames.has(this.badges.JOURNAL_3_STREAK)) {
        if (await this.journalRepo.hasConsecutiveDays(userId, 3)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_3_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_3_STREAK}!`,
            content: "Congratulations on maintaining a 3-day journaling streak! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 7-day streak badge
      if (!badgeNames.has(this.badges.JOURNAL_7_STREAK)) {
        if (await this.journalRepo.hasConsecutiveDays(userId, 7)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_7_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_7_STREAK}!`,
            content: "Congratulations on maintaining a 7-day journaling streak! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 10 entries badge
      if (!badgeNames.has(this.badges.JOURNAL_10_ENTRIES)) {
        if (await this.journalRepo.hasReachedEntryCount(userId, 10)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_10_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_10_ENTRIES}!`,
            content: "Congratulations on writing 10 journal entries! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 20 entries badge
      if (!badgeNames.has(this.badges.JOURNAL_20_ENTRIES)) {
        if (await this.journalRepo.hasReachedEntryCount(userId, 20)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_20_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_20_ENTRIES}!`,
            content: "Congratulations on writing 20 journal entries! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 30 entries badge
      if (!badgeNames.has(this.badges.JOURNAL_30_ENTRIES)) {
        if (await this.journalRepo.hasReachedEntryCount(userId, 30)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.JOURNAL_30_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.JOURNAL_30_ENTRIES}!`,
            content: "Congratulations on writing 30 journal entries! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('[JournalBadgeWorker] Error processing badges:', error);
      throw error; // Re-throw for Pub/Sub retry mechanism
    }
  }

  public async flipAndFeelBadgeWorker(userId: string): Promise<void> {
    try {
      // Get all user badges once for efficiency
      const userBadges = await this.badgesRepo.getUserBadges(userId);
      const badgeNames = new Set(userBadges.map(b => b.badge_name));

      // Check first flip and feel badge
      if (!badgeNames.has(this.badges.FLIP_AND_FEEL_FIRST)) {
        if (await this.flipFeelRepo.hasFirstEntry(userId)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.FLIP_AND_FEEL_FIRST);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.FLIP_AND_FEEL_FIRST}!`,
            content: "Congratulations on completing your first flip and feel entry! This badge recognizes your commitment to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check all categories badge
      if (!badgeNames.has(this.badges.FLIP_AND_FEEL_ALL_CATEGORIES)) {
        const validCategories: CategoryEnum[] = ["school", "opposite_sex", "peers", "family", "crises", "emotions", "recreation"];
        if (await this.flipFeelRepo.hasCompletedAllCategories(userId, validCategories)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.FLIP_AND_FEEL_ALL_CATEGORIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.FLIP_AND_FEEL_ALL_CATEGORIES}!`,
            content: "Congratulations on completing entries in all categories! This badge recognizes your comprehensive approach to self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 7-day streak badge
      if (!badgeNames.has(this.badges.FLIP_AND_FEEL_7_STREAK)) {
        if (await this.flipFeelRepo.hasConsecutiveDays(userId, 7)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.FLIP_AND_FEEL_7_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.FLIP_AND_FEEL_7_STREAK}!`,
            content: "Congratulations on maintaining a 7-day streak! This badge recognizes your consistency in self-reflection and mindfulness. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('[FlipAndFeelBadgeWorker] Error processing badges:', error);
      throw error; // Re-throw for Pub/Sub retry mechanism
    }
  }

  public async moodBadgeWorker(userId: string): Promise<void> {
    try {
      // Get all user badges once for efficiency
      const userBadges = await this.badgesRepo.getUserBadges(userId);
      const badgeNames = new Set(userBadges.map(b => b.badge_name));

      // Check 7-day streak badge
      if (!badgeNames.has(this.badges.MOOD_CHECKIN_7_STREAK)) {
        if (await this.moodRepo.hasConsecutiveDays(userId, 7)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.MOOD_CHECKIN_7_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.MOOD_CHECKIN_7_STREAK}!`,
            content: "Congratulations on maintaining a 7-day streak! This badge recognizes your consistency in mood tracking. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 14-day streak badge
      if (!badgeNames.has(this.badges.MOOD_CHECKIN_14_STREAK)) {
        if (await this.moodRepo.hasConsecutiveDays(userId, 14)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.MOOD_CHECKIN_14_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.MOOD_CHECKIN_14_STREAK}!`,
            content: "Congratulations on maintaining a 14-day streak! This badge recognizes your dedication to mood tracking. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('[MoodBadgeWorker] Error processing badges:', error);
      throw error; // Re-throw for Pub/Sub retry mechanism
    }
  }

  public async gratitudeBadgeWorker(userId: string): Promise<void> {
    try {
      // Get all user badges once for efficiency
      const userBadges = await this.badgesRepo.getUserBadges(userId);
      const badgeNames = new Set(userBadges.map(b => b.badge_name));

      // Check first entry badge
      if (!badgeNames.has(this.badges.GRATITUDE_FIRST_ENTRY)) {
        if (await this.gratitudeRepo.hasFirstEntry(userId)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_FIRST_ENTRY);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_FIRST_ENTRY}!`,
            content: "Congratulations on your first gratitude entry! This badge recognizes your commitment to acknowledging the good in your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 10 entries badge
      if (!badgeNames.has(this.badges.GRATITUDE_10_ENTRIES)) {
        if (await this.gratitudeRepo.hasReachedEntryCount(userId, 10)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_10_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_10_ENTRIES}!`,
            content: "Congratulations on reaching 10 gratitude entries! This badge recognizes your dedication to appreciating the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 25 entries badge
      if (!badgeNames.has(this.badges.GRATITUDE_25_ENTRIES)) {
        if (await this.gratitudeRepo.hasReachedEntryCount(userId, 25)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_25_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_25_ENTRIES}!`,
            content: "Congratulations on reaching 25 gratitude entries! This badge recognizes your dedication to appreciating the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 50 entries badge
      if (!badgeNames.has(this.badges.GRATITUDE_50_ENTRIES)) {
        if (await this.gratitudeRepo.hasReachedEntryCount(userId, 50)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_50_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_50_ENTRIES}!`,
            content: "Congratulations on reaching 50 gratitude entries! This badge recognizes your dedication to appreciating the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 100 entries badge
      if (!badgeNames.has(this.badges.GRATITUDE_100_ENTRIES)) {
        if (await this.gratitudeRepo.hasReachedEntryCount(userId, 100)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_100_ENTRIES);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_100_ENTRIES}!`,
            content: "Congratulations on reaching 100 gratitude entries! This badge recognizes your dedication to appreciating the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 3-day streak badge
      if (!badgeNames.has(this.badges.GRATITUDE_3_STREAK)) {
        if (await this.gratitudeRepo.hasConsecutiveDays(userId, 3)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_3_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_3_STREAK}!`,
            content: "Congratulations on maintaining a 3-day gratitude streak! This badge recognizes your consistency in acknowledging the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Check 7-day streak badge
      if (!badgeNames.has(this.badges.GRATITUDE_7_STREAK)) {
        if (await this.gratitudeRepo.hasConsecutiveDays(userId, 7)) {
          await this.badgesRepo.grantBadgeByName(userId, this.badges.GRATITUDE_7_STREAK);
          await publishMessage(env.PUBSUB_NOTIFICATION_TOPIC, {
            userId: userId,
            type: "activities",
            title: `You have earned a new badge: ${this.badges.GRATITUDE_7_STREAK}!`,
            content: "Congratulations on maintaining a 7-day gratitude streak! This badge recognizes your consistency in acknowledging the positive aspects of your life. Keep it up to earn more badges and deepen your practice.",
            data: {
              activityType: "badge-worker-activity",
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('[GratitudeBadgeWorker] Error processing badges:', error);
      throw error; // Re-throw for Pub/Sub retry mechanism
    }
  }
}