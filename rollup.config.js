export default {
    input : 'src/IF.js',
    output : [
        {
            format: 'umd',
            name: 'IF',
            file: 'dist/IF.js',
            indent: '\t'
        },
        {
            format: 'es',
            file: 'dist/IF.module.js',
            indent: '\t'
        }
    ]
}
