import express, { Router } from 'express';
import { BadgeWorkerController } from '../controllers/badgeWorker.controller.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { JournalEntryRepository } from '../repository/journalEntry.repository.js';
import { BadgeWorkerService } from '../services/badgeWorker.service.js';
import { FlipFeelRepository } from '../repository/flipFeel.repository.js';
import { GratitudeEntryRepository } from '../repository/gratitudeEntry.repository.js';
import { MoodCheckInRepository } from '../repository/moodCheckIn.repository.js';
import { BadgesRepository } from '../repository/badges.repository.js';

const router: Router = express.Router();
const journalRepository = new JournalEntryRepository();
const flipAndFeelRepository = new FlipFeelRepository();
const gratitudeRepository = new GratitudeEntryRepository();
const moodCheckInRepository = new MoodCheckInRepository();
const badgesRepository = new BadgesRepository();
const badgeWorkerService = new BadgeWorkerService(journalRepository, flipAndFeelRepository, gratitudeRepository, moodCheckInRepository, badgesRepository);
const badgeWorkerController = new BadgeWorkerController(badgeWorkerService);

router.post('/', asyncHandler(badgeWorkerController.handleBadgeAwarding.bind(badgeWorkerController)));

export default router;