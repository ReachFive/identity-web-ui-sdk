/** @type {import('tailwindcss').Config} */
module.exports = {
    content: {
        relative: true,
        files: [
            "./src/widgets/mfa/*.{js,ts,jsx,tsx}",
            "./src/**/*.{js,ts,jsx,tsx}",
        ]
    },
    theme: {
        extend: {},
    },
    plugins: [],
};
