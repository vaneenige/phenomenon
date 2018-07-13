import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import serve from 'rollup-plugin-serve';
import eslint from 'rollup-plugin-eslint';

const { DEBUG } = process.env;

const uglifySettings = {
  compress: {
    negate_iife: false,
    unsafe_comps: true,
    properties: true,
    keep_fargs: false,
    pure_getters: true,
    collapse_vars: true,
    unsafe: true,
    warnings: false,
    sequences: true,
    dead_code: true,
    drop_debugger: true,
    comparisons: true,
    conditionals: true,
    evaluate: true,
    booleans: true,
    loops: true,
    unused: true,
    hoist_funs: true,
    if_return: true,
    join_vars: true,
    drop_console: true,
    pure_funcs: ['classCallCheck', 'invariant', 'warning'],
  },
  output: {
    comments: false,
  },
};

const input = DEBUG ? './demo/src/index.js' : './src/index.js';

const output = {
  file: DEBUG ? './demo/dist/bundle.js' : './dist/phenomenon.es.js',
  format: 'es',
  name: 'Phenomenon',
  sourcemap: false,
};

const plugins = [
  /**
   * Verify entry point and all imported files with ESLint.
   * @see https://github.com/TrySound/rollup-plugin-eslint
   */
  eslint({ throwOnError: true }),
  /**
   * Convert ES2015 with buble.
   * @see https://github.com/rollup/rollup-plugin-buble
   */
  babel({
    babelrc: false,
    presets: [['es2015', { loose: true, modules: false }], 'stage-0'],
    plugins: ['external-helpers'],
  }),
];

if (DEBUG) {
  plugins.push(
    /**
     * Serve the bundle for local debugging.
     * @see https://github.com/thgh/rollup-plugin-serve
     */
    serve({
      port: 8080,
      contentBase: 'demo',
    }),
  );
} else {
  plugins.push(
    /**
     * Rollup plugin to minify generated bundle.
     * @see https://github.com/TrySound/rollup-plugin-uglify
     */
    uglify(uglifySettings),
  );
}

export default { input, output, plugins };
