/**
 * Quick single-model test for image generation
 * Usage: node test-single.js <model_name>
 */

const KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const model = process.argv[2] || "gemini-2.5-flash";

async function main() {
  const url = `${BASE}/${model}:generateContent?key=${KEY}`;
  console.log(`Testing ${model} for image generation...`);
  console.log(`URL: ${url}\n`);

  const t0 = Date.now();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Generate an image of a red t-shirt on a white background. Just the shirt, no text.",
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 0.4,
      },
    }),
  });

  console.log(`Status: ${r.status} (${Date.now() - t0}ms)`);

  if (!r.ok) {
    const e = await r.text();
    console.log(`Error: ${e.slice(0, 500)}`);
    return;
  }

  const d = await r.json();
  const parts = d.candidates?.[0]?.content?.parts || [];
  console.log(`Parts: ${parts.length}`);

  let hasImage = false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.inlineData) {
      hasImage = true;
      console.log(
        `Part ${i}: IMAGE mime=${p.inlineData.mimeType} base64_length=${p.inlineData.data?.length}`,
      );
      // Save first few chars to confirm it's real base64
      console.log(`  First 100 chars: ${p.inlineData.data?.slice(0, 100)}`);
    }
    if (p.text) {
      console.log(`Part ${i}: TEXT -> "${p.text.slice(0, 200)}"`);
    }
  }

  console.log(
    `\nResult: ${hasImage ? "✅ IMAGE GENERATED!" : "❌ No image (text only)"}`,
  );
}

main().catch((e) => console.error("Fatal:", e.message));
