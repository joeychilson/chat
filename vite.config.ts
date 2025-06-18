import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import icons from 'unplugin-icons/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss(), icons({ compiler: 'svelte' })]
});
