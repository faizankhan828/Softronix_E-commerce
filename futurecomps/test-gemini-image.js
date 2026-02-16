/**
 * Test script: Gemini Image Generation on Free Tier
 *
 * Tests multiple models and configs to find which one actually works
 * for image generation on the free tier.
 */

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models to test for image generation
const MODELS_TO_TEST = [
  "gemini-2.0-flash", // Official docs say free image gen ✅
  "gemini-2.0-flash-exp", // Experimental variant
  "gemini-2.5-flash-image", // Nano Banana (might be paid only)
  "gemini-2.5-flash", // Regular flash (probably no image output)
];

async function testImageGeneration(model, withResponseModalities) {
  const url = `${BASE_URL}/${model}:generateContent?key=${API_KEY}`;

  const config = {
    temperature: 0.4,
    maxOutputTokens: 4096,
  };

  if (withResponseModalities) {
    config.responseModalities = ["TEXT", "IMAGE"];
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Generate a simple image of a red t-shirt on a white background. The t-shirt should be plain with no text.",
          },
        ],
      },
    ],
    generationConfig: config,
  };

  console.log(`\n${"=".repeat(70)}`);
  console.log(`MODEL: ${model}`);
  console.log(
    `responseModalities: ${withResponseModalities ? '["TEXT", "IMAGE"]' : "NOT SET"}`,
  );
  console.log(`URL: ${url}`);
  console.log(`${"=".repeat(70)}`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `Status: ${response.status} ${response.statusText} (${elapsed}ms)`,
    );

    if (!response.ok) {
      const errText = await response.text();
      console.log(`Error body: ${errText.slice(0, 800)}`);
      return {
        model,
        withResponseModalities,
        success: false,
        status: response.status,
        error: errText.slice(0, 200),
      };
    }

    const data = await response.json();

    // Check candidates
    const candidates = data.candidates || [];
    console.log(`Candidates: ${candidates.length}`);

    if (candidates.length === 0) {
      console.log(`No candidates returned!`);
      // Check for prompt feedback
      if (data.promptFeedback) {
        console.log(
          `Prompt feedback:`,
          JSON.stringify(data.promptFeedback, null, 2),
        );
      }
      return {
        model,
        withResponseModalities,
        success: false,
        error: "No candidates",
      };
    }

    const parts = candidates[0]?.content?.parts || [];
    console.log(`Parts: ${parts.length}`);

    let hasImage = false;
    let hasText = false;
    let textContent = "";
    let imageSize = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.text) {
        hasText = true;
        textContent += part.text;
        console.log(
          `  Part ${i}: TEXT (${part.text.length} chars) -> "${part.text.slice(0, 150)}..."`,
        );
      }
      if (part.inlineData) {
        hasImage = true;
        imageSize = part.inlineData.data?.length || 0;
        console.log(
          `  Part ${i}: IMAGE (mimeType: ${part.inlineData.mimeType}, base64 size: ${imageSize} chars)`,
        );
      }
      if (part.thought) {
        console.log(`  Part ${i}: THOUGHT`);
      }
    }

    const result = {
      model,
      withResponseModalities,
      success: true,
      hasImage,
      hasText,
      imageSize,
      textPreview: textContent.slice(0, 100),
      elapsed,
    };

    if (hasImage) {
      console.log(
        `\n  🎉 IMAGE GENERATED SUCCESSFULLY! (${imageSize} base64 chars)`,
      );
    } else {
      console.log(`\n  ❌ No image in response (text only)`);
    }

    return result;
  } catch (err) {
    console.log(`Exception: ${err.message}`);
    return {
      model,
      withResponseModalities,
      success: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log("🔬 Gemini Image Generation Test Script");
  console.log(`API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`);
  console.log(
    `Testing ${MODELS_TO_TEST.length} models x 2 configs = ${MODELS_TO_TEST.length * 2} tests\n`,
  );

  const results = [];

  for (const model of MODELS_TO_TEST) {
    // Test WITH responseModalities
    const r1 = await testImageGeneration(model, true);
    results.push(r1);

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000));

    // Test WITHOUT responseModalities (only text, but check if image comes anyway)
    const r2 = await testImageGeneration(model, false);
    results.push(r2);

    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary table
  console.log(`\n\n${"=".repeat(70)}`);
  console.log("📊 SUMMARY");
  console.log(`${"=".repeat(70)}`);
  console.log(
    `${"Model".padEnd(35)} | ${"Modalities".padEnd(12)} | ${"Status".padEnd(8)} | Image?`,
  );
  console.log(
    `${"-".repeat(35)}-+-${"-".repeat(12)}-+-${"-".repeat(8)}-+-------`,
  );

  for (const r of results) {
    const modalities = r.withResponseModalities ? "TEXT+IMAGE" : "default";
    const status = r.success ? r.status || "200" : r.status || "ERR";
    const image = r.hasImage
      ? `✅ (${r.imageSize} chars)`
      : r.success
        ? "❌ text only"
        : `❌ ${(r.error || "").slice(0, 30)}`;
    console.log(
      `${r.model.padEnd(35)} | ${String(modalities).padEnd(12)} | ${String(status).padEnd(8)} | ${image}`,
    );
  }

  // Find winners
  const winners = results.filter((r) => r.success && r.hasImage);
  console.log(`\n🏆 WORKING MODELS FOR FREE IMAGE GEN: ${winners.length}`);
  for (const w of winners) {
    console.log(
      `   ✅ ${w.model} (responseModalities: ${w.withResponseModalities ? "yes" : "no"}) - ${w.elapsed}ms`,
    );
  }

  if (winners.length === 0) {
    console.log("   ❌ No models generated images on free tier");
    console.log("   💡 The text-description fallback should be used instead");
  }
}

main().catch(console.error);
