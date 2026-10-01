module.exports = {
    plugins: [
        require('tailwindcss'),
        require('./scripts/postcss-scope-to-widget.cjs'),
        require('autoprefixer'),
    ],
};
