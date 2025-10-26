
import { type Request, type NextFunction, type Response} from "express";
import type { BadgeWorkerService } from "../services/badgeWorker.service.js";
import { logger } from "../utils/logger.util.js";

interface PubSubMessage {
  message: {
    data: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
}

interface ActivityPayload {
  eventType: 'JOURNAL_ENTRY_CREATED' | 'FLIP_FEEL_ENTRY_CREATED' | 'MOOD_CHECKIN_CREATED' | 'GRATITUDE_ENTRY_CREATED';
  userId: string;
  checkInId?: string;
  timestamp: string;
}

/**
 * Controller class for handling badge awarding via Pub/Sub messages.
 * 
 * @description This class provides methods to handle Pub/Sub messages from activity events
 * and triggers badge checks based on the event type.
 * 
 * @remarks
 * - Receives Pub/Sub messages in base64-encoded format
 * - Decodes and validates message structure
 * - Routes to appropriate badge worker based on eventType
 * - Returns 204 on success, 400 on bad request, 500 on error
 * 
 * @example
 * ```typescript
 * const controller = new BadgeWorkerController(badgeWorkerService);
 * app.post('/pubsub/badge-worker', controller.handleBadgeAwarding.bind(controller));
 * ```
 * 
 * @file badgeWorker.controller.ts
 * 
 * @author Arthur M. Artugue
 * @created 2025-10-26
 * @updated 2025-10-26
 */
export class BadgeWorkerController {
  private badgeWorkerService : BadgeWorkerService;

  constructor(badgeWorkerService: BadgeWorkerService){
    this.badgeWorkerService = badgeWorkerService
  }

  /**
   * Handles incoming Pub/Sub messages for badge awarding.
   * 
   * @param req - Express request containing Pub/Sub message envelope
   * @param res - Express response
   * @param _next - Express next function (unused)
   * 
   * @remarks
   * Expected message format:
   * {
   *   message: {
   *     data: "<base64-encoded-json>",
   *     messageId: "...",
   *     publishTime: "..."
   *   }
   * }
   * 
   * Decoded payload format:
   * {
   *   eventType: "JOURNAL_ENTRY_CREATED" | "FLIP_FEEL_ENTRY_CREATED" | "MOOD_CHECKIN_CREATED" | "GRATITUDE_ENTRY_CREATED",
   *   userId: "uuid",
   *   checkInId: "uuid" (optional),
   *   timestamp: "ISO-8601 timestamp"
   * }
   */
  public async handleBadgeAwarding(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const envelope = req.body as PubSubMessage;

      // Validate envelope structure
      if (!envelope || !envelope.message) {
        logger.error('[BadgeWorker] Invalid Pub/Sub message format');
        res.status(400).json({ error: 'Bad Request: Invalid message format' });
        return;
      }

      if (!envelope.message.data) {
        logger.error('[BadgeWorker] No data field in Pub/Sub message');
        res.status(400).json({ error: 'Bad Request: No data field' });
        return;
      }

      // Decode the base64-encoded message data
      const dataStr = Buffer.from(envelope.message.data, 'base64').toString('utf-8');
      const payload: ActivityPayload = JSON.parse(dataStr);

      // Validate payload
      if (!payload.eventType || !payload.userId) {
        logger.error('[BadgeWorker] Missing required fields in payload:', payload);
        res.status(400).json({ error: 'Bad Request: Missing eventType or userId' });
        return;
      }

      logger.info(`[BadgeWorker] Processing event: ${payload.eventType} for user: ${payload.userId}`);

      // Route to appropriate badge worker based on eventType
      switch (payload.eventType) {
        case 'JOURNAL_ENTRY_CREATED':
          await this.badgeWorkerService.journalBadgeWorker(payload.userId);
          break;

        case 'FLIP_FEEL_ENTRY_CREATED':
          await this.badgeWorkerService.flipAndFeelBadgeWorker(payload.userId);
          break;

        case 'MOOD_CHECKIN_CREATED':
          await this.badgeWorkerService.moodBadgeWorker(payload.userId);
          break;

        case 'GRATITUDE_ENTRY_CREATED':
          await this.badgeWorkerService.gratitudeBadgeWorker(payload.userId);
          break;

        default:
          logger.warn(`[BadgeWorker] Unknown event type: ${payload.eventType}`);
          res.status(400).json({ error: `Unknown event type: ${payload.eventType}` });
          return;
      }

      logger.info(`[BadgeWorker] Successfully processed ${payload.eventType} for user ${payload.userId}`);
      
      // Return 204 No Content on success (Pub/Sub will ack the message)
      res.status(204).send();
      return;

    } catch (error) {
      logger.error('[BadgeWorker] Error processing Pub/Sub message:', error);
      
      // Return 500 so Pub/Sub retries the message
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
      return;
    }
  }
}