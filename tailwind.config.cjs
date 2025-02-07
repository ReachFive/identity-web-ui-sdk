/** @type {import('tailwindcss').Config} */
module.exports = {
    content: {
        relative: true,
        files: [
            "./src/**/*.{js,ts,jsx,tsx}",
        ]
    },
    theme: {
        extend: {
            colors: {
                primaryColor: "var(--primary-color)",
                dangerColor: "var(--danger-color)",
                textColor: "var(--text-color)",
                borderColor: "var(--border-color)",
                lightBackgroundColor: "var(--light-background-color)",
            },
        },
    },
};
