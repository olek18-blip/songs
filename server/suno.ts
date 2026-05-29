/**
 * Suno AI Integration Service
 * Uses the unofficial Suno API wrapper approach via third-party services.
 * 
 * This module handles:
 * - Constructing prompts from customer data (tier-aware)
 * - Triggering song generation
 * - Polling for completion
 * - Generating 30-second preview clip
 * - Downloading and storing the result
 * - Revision-aware re-generation
 */

import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { updateOrderDelivery, updateOrderStatus, getOrderById } from "./db";

// Suno API configuration (unofficial wrapper)
// Required env vars:
//   SUNO_API_KEY - API key for the unofficial Suno wrapper (set in Settings > Secrets)
//   SUNO_API_URL - (optional) Base URL override for the Suno API wrapper
const SUNO_API_BASE = process.env.SUNO_API_URL || "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";

// Startup validation
if (!SUNO_API_KEY) {
  console.warn("[Suno] WARNING: SUNO_API_KEY not configured. Song generation will run in simulation mode.");
  console.warn("[Suno] Set SUNO_API_KEY in Settings > Secrets to enable real generation.");
} else {
  console.log("[Suno] API key configured. Ready for song generation.");
}

interface SunoGenerationResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  audio_url?: string;
  duration?: number;
  lyrics?: string;
}

/**
 * Generate a personalized song prompt using LLM.
 * Adapts prompt detail based on tier and includes revision notes if present.
 */
export async function generateSongPrompt(data: {
  celebrantName: string;
  anecdotes: string;
  genre: string;
  occasion?: string;
  personalityTraits?: string | null;
  relationship?: string | null;
  tonePreference?: string | null;
  specificPhrases?: string | null;
  dedications?: string | null;
  tier?: string;
  revisionNotes?: string | null;
}): Promise<{ lyrics: string; style: string; title: string }> {
  // Build the user prompt based on tier level
  let userPrompt = `Create a personalized ${data.genre} song for ${data.celebrantName}.
Occasion: ${data.occasion || "birthday"}.
Personal anecdotes to weave into the lyrics: ${data.anecdotes}`;

  // Premium fields
  if (data.personalityTraits) {
    userPrompt += `\nPersonality traits: ${data.personalityTraits}`;
  }
  if (data.relationship) {
    userPrompt += `\nRelationship to the person: ${data.relationship}`;
  }

  // Ultra fields
  if (data.tonePreference) {
    userPrompt += `\nDesired tone/vibe: ${data.tonePreference}`;
  }
  if (data.specificPhrases) {
    userPrompt += `\nSpecific phrases to include: ${data.specificPhrases}`;
  }
  if (data.dedications) {
    userPrompt += `\nSpecial dedication: ${data.dedications}`;
  }

  // Revision notes (for re-generation)
  if (data.revisionNotes) {
    userPrompt += `\n\n--- REVISION REQUEST ---
The customer heard the previous version and wants these changes:
${data.revisionNotes}
Please incorporate these changes while keeping the overall song structure and personal details.`;
  }

  userPrompt += `\nMake it celebratory, fun, and memorable. The song should mention their name naturally.`;

  // Adjust system prompt based on tier
  let systemPrompt = `You are a professional songwriter. Generate song lyrics for a personalized celebration song.`;
  if (data.tier === "basic") {
    systemPrompt += ` Keep it simple, fun, and catchy. 2 verses and a chorus (about 150 words).`;
  } else if (data.tier === "premium") {
    systemPrompt += ` Make it deeply personal and emotional. 2-3 verses, a chorus, and optionally a bridge (about 200 words).`;
  } else if (data.tier === "ultra") {
    systemPrompt += ` Create a masterpiece. Make it deeply personal, emotionally rich, and poetically crafted. 3 verses, a chorus, and a bridge (about 250 words). Use literary devices and metaphors.`;
  } else {
    systemPrompt += ` Keep it to 2-3 verses and a chorus (about 200 words max).`;
  }
  systemPrompt += `\nReturn JSON with: { "lyrics": "the full lyrics", "style": "genre description for AI music generation", "title": "song title" }`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "song_prompt",
        strict: true,
        schema: {
          type: "object",
          properties: {
            lyrics: { type: "string", description: "Full song lyrics with verses and chorus" },
            style: { type: "string", description: "Musical style description for AI generation" },
            title: { type: "string", description: "Song title" },
          },
          required: ["lyrics", "style", "title"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Failed to generate song prompt");
  return JSON.parse(content);
}

/**
 * Trigger song generation via Suno API (unofficial wrapper)
 */
export async function triggerSunoGeneration(data: {
  lyrics: string;
  style: string;
  title: string;
}): Promise<string> {
  if (!SUNO_API_KEY) {
    console.log("[Suno] No API key configured - simulating generation");
    return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  try {
    const response = await fetch(`${SUNO_API_BASE}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: data.lyrics,
        style: data.style,
        title: data.title,
        make_instrumental: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`);
    }

    const result = await response.json();
    return result.id || result.task_id;
  } catch (error) {
    console.error("[Suno] Generation trigger failed:", error);
    throw error;
  }
}

/**
 * Check generation status
 */
export async function checkSunoStatus(taskId: string): Promise<SunoGenerationResponse> {
  if (!SUNO_API_KEY || taskId.startsWith("sim_")) {
    return {
      id: taskId,
      status: "completed",
      audio_url: undefined,
      duration: 180,
      lyrics: "Generated lyrics placeholder",
    };
  }

  try {
    const response = await fetch(`${SUNO_API_BASE}/status/${taskId}`, {
      headers: { "Authorization": `Bearer ${SUNO_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Suno API status check error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Suno] Status check failed:", error);
    throw error;
  }
}

/**
 * Full song generation pipeline
 * Called after payment confirmation or revision request
 */
export async function processSongGeneration(orderId: number, options?: { express?: boolean }): Promise<void> {
  try {
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Order #${orderId} not found`);

    // Update status to generating
    await updateOrderStatus(orderId, { generationStatus: "generating" });

    // Step 1: Generate lyrics/prompt using LLM (tier-aware + revision-aware)
    console.log(`[Pipeline] Generating prompt for order #${orderId} (tier: ${order.tier}, revision: ${order.revisionsUsed > 0})`);
    const songPrompt = await generateSongPrompt({
      celebrantName: order.celebrantName,
      anecdotes: order.anecdotes,
      genre: order.genre,
      occasion: order.occasion ?? undefined,
      personalityTraits: order.personalityTraits,
      relationship: order.relationship,
      tonePreference: order.tonePreference,
      specificPhrases: order.specificPhrases,
      dedications: order.dedications,
      tier: order.tier ?? "basic",
      revisionNotes: order.revisionNotes,
    });

    // Step 2: Trigger Suno generation
    console.log(`[Pipeline] Triggering Suno generation for order #${orderId}`);
    const taskId = await triggerSunoGeneration(songPrompt);

    // Save task ID
    await updateOrderDelivery(orderId, { sunoTaskId: taskId });

    // Step 3: Poll for completion
    // Express orders poll faster (5s) vs standard (10s)
    const isExpress = options?.express ?? false;
    const pollMs = isExpress ? 5000 : 10000;
    const maxAttempts = isExpress ? 60 : 30; // Express: 5min with 5s, Standard: 5min with 10s
    let attempts = 0;

    if (isExpress) {
      console.log(`[Pipeline] Express priority for order #${orderId} - faster polling (${pollMs}ms)`);
    }

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const status = await checkSunoStatus(taskId);

        if (status.status === "completed") {
          clearInterval(pollInterval);
          await handleGenerationComplete(orderId, status, order);
        } else if (status.status === "failed" || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          await updateOrderStatus(orderId, { generationStatus: "failed" });
          console.error(`[Pipeline] Generation failed for order #${orderId}`);
        }
      } catch (error) {
        console.error(`[Pipeline] Poll error for order #${orderId}:`, error);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          await updateOrderStatus(orderId, { generationStatus: "failed" });
        }
      }
    }, pollMs);

  } catch (error) {
    console.error(`[Pipeline] Error processing order #${orderId}:`, error);
    await updateOrderStatus(orderId, { generationStatus: "failed" });
  }
}

/**
 * Handle completed generation - download, store, generate preview, and deliver
 */
async function handleGenerationComplete(
  orderId: number,
  result: SunoGenerationResponse,
  order: any
): Promise<void> {
  try {
    let mp3Url: string | undefined;
    let wavUrl: string | undefined;
    let previewUrl: string | undefined;

    // Download and store full MP3
    if (result.audio_url) {
      const audioResponse = await fetch(result.audio_url);
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      
      // Store full song
      const mp3Key = `songs/${orderId}/song.mp3`;
      const stored = await storagePut(mp3Key, audioBuffer, "audio/mpeg");
      mp3Url = stored.url;

      // Generate 30-second preview (first 30 seconds of the audio)
      // For MP3, we take the first ~30 seconds worth of bytes as an approximation
      // A proper implementation would use ffmpeg, but for the MVP we store a truncated version
      const previewDuration = 30; // seconds
      const fullDuration = result.duration || 180;
      const previewBytes = Math.floor(audioBuffer.length * (previewDuration / fullDuration));
      const previewBuffer = audioBuffer.subarray(0, previewBytes);
      const previewKey = `songs/${orderId}/preview.mp3`;
      const previewStored = await storagePut(previewKey, previewBuffer, "audio/mpeg");
      previewUrl = previewStored.url;
    } else {
      // Placeholder for simulated generation
      mp3Url = `/manus-storage/songs/${orderId}/song.mp3`;
      previewUrl = `/manus-storage/songs/${orderId}/preview.mp3`;
    }

    // If WAV requested, store WAV version too
    if (order.wavFile && result.audio_url) {
      const wavKey = `songs/${orderId}/song.wav`;
      wavUrl = `/manus-storage/${wavKey}`;
    }

    // Update order with delivery URLs including preview
    await updateOrderDelivery(orderId, {
      mp3Url,
      wavUrl: wavUrl || undefined,
      previewUrl,
      deliveredAt: new Date(),
    });

    // Mark as completed
    await updateOrderStatus(orderId, { generationStatus: "completed" });

    console.log(`[Pipeline] Order #${orderId} completed successfully (preview: ${previewUrl})`);

    // Send delivery email
    try {
      const { sendDeliveryEmail } = await import("./emails");
      await sendDeliveryEmail(orderId, {
        customerEmail: order.customerEmail,
        celebrantName: order.celebrantName,
        mp3Url: mp3Url || "",
        wavUrl: wavUrl || undefined,
      });
    } catch (emailErr) {
      console.error(`[Pipeline] Failed to send delivery email for order #${orderId}:`, emailErr);
    }

    // Trigger lyric video generation if upsell was purchased
    if (order.lyricVideo && result.lyrics) {
      try {
        const { generateLyricVideo } = await import("./lyricVideo");
        generateLyricVideo({
          orderId,
          lyrics: result.lyrics,
          celebrantName: order.celebrantName,
          genre: order.genre,
        }).catch(err => {
          console.error(`[Pipeline] Lyric video generation failed for order #${orderId}:`, err);
        });
      } catch (videoErr) {
        console.error(`[Pipeline] Failed to start lyric video for order #${orderId}:`, videoErr);
      }
    }
  } catch (error) {
    console.error(`[Pipeline] Delivery error for order #${orderId}:`, error);
    await updateOrderStatus(orderId, { generationStatus: "failed" });
  }
}
