export default {
    input : 'src/IF.js',
    output : [
        // (Universal Module Definition) — Works as amd, cjs, and iife all in one.
        {
            format: 'umd',
            name: 'IF',
            file: 'dist/IF.js',
            indent: '\t'
        },
        // Keep the bundle as an ES module file. Suitable for other bundlers and inclusion as a <script type=module> tag in modern browsers (alias: esm, module).
        {
            format: 'es',
            file: 'dist/IF.es.js',
            indent: '\t'
        }
        // Refer to: https://betterprogramming.pub/what-are-cjs-amd-umd-esm-system-and-iife-3633a112db62
    ]
    /*,
    plugins: [
        babel({
            babelHelpers: 'bundled',
            presets:[
                [
                    '@babel/preset-env',
                    {
                        loose : true,
                        modules: false,
                         targets: {
                            esmodules: true,
                        },
                    },
                ]
            ]
        })
    ]
     */
}
