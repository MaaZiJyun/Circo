import path from "node:path";

import { env, pipeline } from "@huggingface/transformers";

env.cacheDir = path.join(process.cwd(), "data", "models");

for (const model of ["Xenova/opus-mt-en-zh", "Xenova/opus-mt-zh-en"]) {
  process.stdout.write(`Downloading ${model}...\n`);
  const translator = await pipeline("translation", model, { dtype: "q8" });
  await translator.dispose();
}

process.stdout.write(`Translation models are ready in ${env.cacheDir}.\n`);
