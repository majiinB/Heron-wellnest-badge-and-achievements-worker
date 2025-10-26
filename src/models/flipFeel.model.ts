import type { FlipFeelResponse } from "./flipFeelResponse.model.js";

/**
 * @file flipFeel.model.ts
 * 
 * @description Flip and feel model for the Heron Wellnest Activities API.
 * 
 * @author Arthur M. Artugue
 * @created 2025-10-18
 * @updated 2025-10-26
 */

export interface FlipFeel {
    flip_feel_id: string;
    user_id: string;
    responses?: FlipFeelResponse[];
    started_at: Date | null;
    finished_at: Date | null;
}