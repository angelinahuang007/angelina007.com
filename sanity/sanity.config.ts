import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

// Validation
if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable');
}

export default defineConfig({
  name: 'angelina007_portfolio',
  title: 'Angelina Portfolio CMS',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  tools: (prev) => {
    // Remove vision tool in production
    if (process.env.NODE_ENV === 'production') {
      return prev.filter((tool) => tool.name !== 'vision');
    }
    return prev;
  },
});
