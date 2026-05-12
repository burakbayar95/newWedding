import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const defaultBasePath = '/wedding-upload/';

function normalizeBasePath(basePath: string | undefined) {
  if (!basePath) {
    return defaultBasePath;
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    plugins: [react()],
  };
});
