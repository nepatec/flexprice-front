import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';

const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

// nepatec: context path, e.g. VITE_BASE_PATH=/flexprice/ behind the reverse proxy at https://<stage>.app.nepatec.de/flexprice/
// (set by flexprice-deploy). Read when the server starts; defaults to the root for local development.
const BASE = process.env.VITE_BASE_PATH || '/';

// nepatec: the sources reference files of public/ by absolute string literals ('/assets/...', '/comicon.png'),
// which Vite does not rebase. Prefix them with BASE so they are not requested outside the context path.
const rebasePublicAssets = (): Plugin => ({
	name: 'nepatec-rebase-public-assets',
	enforce: 'pre',
	transform(code, id) {
		if (BASE === '/' || !/\/src\/.*\.[jt]sx?$/.test(id)) return null;
		return code.replace(/(['"`])\/(assets\/|comicon\.png|favicon\.ico)/g, `$1${BASE}$2`);
	},
});

export default defineConfig({
	base: BASE,
	plugins: [rebasePublicAssets(), react()],
	define: {
		__APP_VERSION__: JSON.stringify(meta.versionId),
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		cors: {
			origin: 'http://localhost:3000',
			methods: ['GET', 'POST'],
		},
		host: 'localhost',
		// nepatec: the dev server (also used in deployments) rejects requests for unknown Host headers
		allowedHosts: ['.nepatec.de'],
	},
});
