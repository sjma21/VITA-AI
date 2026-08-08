-- Switch embedding column to Nemotron 3 Embed 1B dimensions (OpenRouter free)
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(2048);
