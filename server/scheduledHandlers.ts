/**
 * Scheduled task handlers for cron-triggered operations.
 * These handlers are called by the Manus Heartbeat system.
 */

import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { processAbandonedCarts } from "./emails";

/**
 * Handler: Process abandoned carts and send retargeting emails
 * Called every hour to find unconverted leads and send them 20% discount coupons.
 * Path: /api/scheduled/retargeting
 */
export async function retargetingHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await processAbandonedCarts();
    console.log(`[Retargeting] Processed ${result.processed} leads, sent ${result.sent} emails`);
    
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("[Retargeting] Handler error:", error);
    res.status(500).json({
      error: error.message || "Internal error",
      stack: error.stack,
      context: { url: req.url, taskUid: (error as any)?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
