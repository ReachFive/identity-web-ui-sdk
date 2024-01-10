module.exports = {
    presets: [
        '@babel/preset-env',
        ['@babel/preset-react', {runtime: 'automatic'}],
        '@babel/preset-typescript',
    ],
    plugins: [
        'babel-plugin-dynamic-import-node'
    ],
};
