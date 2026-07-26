import { transform } from 'esbuild';

/** Pre-transform Astro component `<script>` blocks so Vite 8 oxc receives plain JS. */
export function astroScriptTsPlugin() {
  return {
    name: 'astro-script-ts-esbuild',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.includes('?astro&type=script') || !id.includes('lang.ts')) return null;

      const result = await transform(code, {
        loader: 'ts',
        target: 'es2022',
        sourcemap: true,
        tsconfigRaw: {
          compilerOptions: {
            verbatimModuleSyntax: false,
          },
        },
      });

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
