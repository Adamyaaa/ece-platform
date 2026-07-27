import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { VOYAGE_DIMENSIONS } from '../rag/embeddings';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function setup() {
  if (!MONGO_URI) {
    console.error('❌ No MONGO_URI set.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const collection = mongoose.connection.collection('embeddingchunks');

  const existing = await collection.listSearchIndexes('vector_index').toArray().catch(() => []);
  if (existing.length > 0) {
    console.log("ℹ️ 'vector_index' already exists on embeddingchunks — nothing to do.");
    await mongoose.disconnect();
    return;
  }

  console.log(`🔧 Creating Atlas Vector Search index 'vector_index' (${VOYAGE_DIMENSIONS} dimensions)...`);
  await collection.createSearchIndex({
    name: 'vector_index',
    type: 'vectorSearch',
    definition: {
      fields: [
        { type: 'vector', path: 'embedding', numDimensions: VOYAGE_DIMENSIONS, similarity: 'cosine' },
      ],
    },
  });

  console.log('✅ Index creation requested. Atlas builds it asynchronously — this can take a minute or two before queries succeed.');
  await mongoose.disconnect();
}

setup().catch((err) => {
  console.error('❌ Failed to create vector index:', err.message);
  process.exit(1);
});
