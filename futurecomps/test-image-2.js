/**
 * Test: Can gemini-2.5-flash generate images on free tier?
 * Wait for rate limits to cool, then try with responseModalities.
 */

const KEY = "***REDACTED_GOOGLE_API_KEY_1***";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function test(model) {
  const url = `${BASE}/${model}:generateContent?key=${KEY}`;
  console.log(`\nTesting ${model}...`);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Generate an image of a red t-shirt on a white background, no text. Just the shirt.",
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
    console.log(`  Status: ${r.status}`);
    if (!r.ok) {
      const e = await r.text();
      const lim = e.match(/limit: (\d+)/);
      console.log(`  Limit: ${lim ? lim[1] : "?"}`);
      console.log(`  Error: ${e.slice(0, 300)}`);
      return;
    }
    const d = await r.json();
    const parts = d.candidates?.[0]?.content?.parts || [];
    console.log(`  Parts: ${parts.length}`);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.inlineData) {
        console.log(
          `  Part ${i}: IMAGE!!! mime=${p.inlineData.mimeType} size=${p.inlineData.data?.length} chars`,
        );
      }
      if (p.text) {
        console.log(
          `  Part ${i}: TEXT (${p.text.length} chars) -> ${p.text.slice(0, 150)}`,
        );
      }
      if (p.thought !== undefined) {
        console.log(`  Part ${i}: THOUGHT`);
      }
    }
  } catch (e) {
    console.error(`  Exception: ${e.message}`);
  }
}

async function main() {
  console.log("Waiting 30s for rate limits to cool...");
  await new Promise((r) => setTimeout(r, 30000));

  // Test models that had limit > 0 (not permanently blocked)
  await test("gemini-2.5-flash");
  await new Promise((r) => setTimeout(r, 5000));

  await test("gemini-2.5-flash-preview-09-2025");
  await new Promise((r) => setTimeout(r, 5000));

  await test("gemini-3-flash-preview");
}

main().catch(console.error);
