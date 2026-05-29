/**
 * Lyric Video Generation Service
 * 
 * Generates a lyric video by:
 * 1. Splitting lyrics into segments
 * 2. Generating cinematic/Urban Noir AI images for each segment
 * 3. Creating a simple HTML-based video preview (image slideshow with lyrics overlay)
 * 4. Storing the result in S3
 * 
 * Note: Full video assembly (ffmpeg) requires a persistent compute environment.
 * This implementation generates the visual assets and a web-based player as the MVP.
 */

import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { updateOrderDelivery } from "./db";

interface LyricVideoOptions {
  orderId: number;
  lyrics: string;
  celebrantName: string;
  genre: string;
}

/**
 * Split lyrics into visual segments (verse/chorus blocks)
 */
function splitLyricsIntoSegments(lyrics: string): string[] {
  const lines = lyrics.split("\n").filter(l => l.trim());
  const segments: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    current.push(line);
    if (current.length >= 4) {
      segments.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length > 0) {
    segments.push(current.join("\n"));
  }
  return segments.slice(0, 6); // Max 6 segments for performance
}

/**
 * Generate a cinematic/Urban Noir image for a lyric segment
 */
async function generateSceneImage(
  segment: string,
  genre: string,
  celebrantName: string,
  sceneIndex: number
): Promise<string> {
  const moods = [
    "dramatic neon-lit city alley at night",
    "moody rooftop overlooking a glowing skyline",
    "cinematic rain-soaked street with reflections",
    "atmospheric dark lounge with warm golden light",
    "dramatic silhouette against a sunset cityscape",
    "intimate candlelit scene with bokeh lights",
  ];

  const mood = moods[sceneIndex % moods.length];
  const prompt = `Cinematic Urban Noir style, ${mood}, ${genre} music atmosphere, dramatic lighting, film grain, moody color grading, 16:9 aspect ratio, no text, no people's faces, abstract and artistic`;

  try {
    const result = await generateImage({ prompt });
    return result.url || "";
  } catch (error) {
    console.error(`[LyricVideo] Failed to generate image for scene ${sceneIndex}:`, error);
    return "";
  }
}

/**
 * Generate a web-based lyric video player (HTML with images and lyrics overlay)
 */
function generateVideoPlayerHtml(
  images: string[],
  segments: string[],
  celebrantName: string,
  genre: string
): string {
  const slides = images.map((img, i) => ({
    image: img,
    lyrics: segments[i] || "",
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lyric Video - Song for ${celebrantName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; color: #fff; font-family: 'Georgia', serif; overflow: hidden; }
    .slide-container { position: relative; width: 100vw; height: 100vh; }
    .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.5s ease; display: flex; align-items: center; justify-content: center; }
    .slide.active { opacity: 1; }
    .slide-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.4); }
    .lyrics-overlay { position: relative; z-index: 2; text-align: center; padding: 2rem; max-width: 80%; }
    .lyrics-overlay p { font-size: 1.8rem; line-height: 1.8; text-shadow: 0 2px 20px rgba(0,0,0,0.8); color: #f0e6d3; font-style: italic; }
    .progress { position: fixed; bottom: 0; left: 0; height: 3px; background: linear-gradient(90deg, #d4a853, #f0c674); transition: width 0.3s linear; z-index: 10; }
    .title { position: fixed; top: 2rem; left: 50%; transform: translateX(-50%); font-size: 0.9rem; color: #d4a853; letter-spacing: 2px; text-transform: uppercase; z-index: 10; }
  </style>
</head>
<body>
  <div class="title">🎵 Song for ${celebrantName}</div>
  <div class="slide-container">
    ${slides.map((s, i) => `
    <div class="slide${i === 0 ? " active" : ""}" data-index="${i}">
      <div class="slide-bg" style="background-image: url('${s.image}')"></div>
      <div class="lyrics-overlay">
        ${s.lyrics.split("\n").map(line => `<p>${line}</p>`).join("\n        ")}
      </div>
    </div>`).join("")}
  </div>
  <div class="progress" id="progress"></div>
  <script>
    const slides = document.querySelectorAll('.slide');
    const progress = document.getElementById('progress');
    let current = 0;
    const interval = 6000;
    function nextSlide() {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
      progress.style.width = ((current + 1) / slides.length * 100) + '%';
    }
    progress.style.width = (1 / slides.length * 100) + '%';
    setInterval(nextSlide, interval);
  </script>
</body>
</html>`;
}

/**
 * Full lyric video generation pipeline
 */
export async function generateLyricVideo(options: LyricVideoOptions): Promise<string | null> {
  const { orderId, lyrics, celebrantName, genre } = options;

  try {
    console.log(`[LyricVideo] Starting generation for order #${orderId}`);

    // Step 1: Split lyrics into segments
    const segments = splitLyricsIntoSegments(lyrics);
    console.log(`[LyricVideo] Split into ${segments.length} segments`);

    // Step 2: Generate images for each segment
    const images: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      console.log(`[LyricVideo] Generating image ${i + 1}/${segments.length}`);
      const imageUrl = await generateSceneImage(segments[i], genre, celebrantName, i);
      if (imageUrl) {
        images.push(imageUrl);
      }
    }

    if (images.length === 0) {
      console.error(`[LyricVideo] No images generated for order #${orderId}`);
      return null;
    }

    // Step 3: Generate the HTML video player
    const html = generateVideoPlayerHtml(images, segments, celebrantName, genre);

    // Step 4: Store in S3
    const videoKey = `videos/${orderId}/lyric-video.html`;
    const { url } = await storagePut(videoKey, Buffer.from(html, "utf-8"), "text/html");

    // Step 5: Update order with video URL
    await updateOrderDelivery(orderId, { videoUrl: url });

    console.log(`[LyricVideo] Completed for order #${orderId}: ${url}`);
    return url;
  } catch (error) {
    console.error(`[LyricVideo] Error for order #${orderId}:`, error);
    return null;
  }
}
