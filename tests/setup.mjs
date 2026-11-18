// Loaded with `node --import ./tests/setup.mjs`. lib/ uses extensionless relative imports
// (Next/bundler style); Node's ESM resolver needs the extension, so retry with `.ts`.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (e?.code === 'ERR_MODULE_NOT_FOUND' && /^\.\.?\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier)) {
        return next(specifier + '.ts', context);
      }
      throw e;
    }
  },
});
