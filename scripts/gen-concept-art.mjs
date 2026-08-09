import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const API_KEY = process.env.RUNWARE_API_KEY;
if (!API_KEY) {
  console.error("Missing RUNWARE_API_KEY. Copy .env.example to .env and paste in the key from MythOS's root .env.");
  process.exit(1);
}

const MODEL = process.env.RUNWARE_MODEL || "runware:111@1";

const STYLE_SUFFIX =
  "flat color 1960s pulp sci-fi poster illustration, thick black ink outlines, " +
  "limited palette of cream, mustard yellow, teal, and vermilion red, plain simple background, " +
  "no text, no lettering, no watermark";

const NEGATIVE_PROMPT = "text, words, letters, captions, titles, watermark, signature, blurry, photorealistic";

const SUBJECTS = [
  { name: "curly", prompt: `Retro mad scientist named Curly Kerlington wearing a green hazmat suit with a clear helmet, full body, ${STYLE_SUFFIX}` },
  { name: "robby", prompt: `Boxy chrome companion robot inspired by 1950s sci-fi robots, friendly rounded head with a single round eye, full body, ${STYLE_SUFFIX}` },
  { name: "robotaxman", prompt: `Menacing robot tax collector wearing a suit and tie, carrying a briefcase, full body, ${STYLE_SUFFIX}` },
  { name: "water-cannon", prompt: `A turret-mounted water cannon built from lab equipment and pipes, mounted on a tripod, side view, ${STYLE_SUFFIX}` },
  { name: "hydrogen", prompt: `A single glowing atom icon with one proton and one electron orbiting, simple atomic diagram, ${STYLE_SUFFIX}` },
  { name: "oxygen", prompt: `A glowing atom icon with a dense nucleus and electron shells orbiting, simple atomic diagram, ${STYLE_SUFFIX}` },
];

async function generate(subject) {
  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify([
      {
        taskType: "imageInference",
        taskUUID: randomUUID(),
        positivePrompt: subject.prompt,
        negativePrompt: NEGATIVE_PROMPT,
        model: MODEL,
        width: 1024,
        height: 1024,
        numberResults: 1,
        steps: 30,
        CFGScale: 3.5,
        trueCFGScale: 1,
        scheduler: "FlowMatchEulerDiscreteScheduler",
        includeCost: true,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`Runware request failed for ${subject.name}: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const data = body?.data ?? body;
  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.imageURL) {
    throw new Error(`No image URL returned for ${subject.name}: ${JSON.stringify(body)}`);
  }

  const imageResponse = await fetch(result.imageURL);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  // Runware returns JPEG-encoded data regardless of request format, so save as .jpg
  await writeFile(`public/concept-art/${subject.name}.jpg`, buffer);
  console.log(`Saved public/concept-art/${subject.name}.jpg${result.cost ? ` (cost: ${result.cost})` : ""}`);
}

await mkdir("public/concept-art", { recursive: true });
for (const subject of SUBJECTS) {
  await generate(subject);
}
