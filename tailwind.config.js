import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                // Warna kustom sesuai desain
                'primary': '#001944',
                'primary-container': '#002c6e',
                'secondary': '#775a19',
                'secondary-fixed': '#ffdea5',
                'on-secondary-fixed': '#261900',
                'surface': '#f9f9f9',
                'surface-container-low': '#f3f3f3',
                'surface-container-high': '#e8e8e8',
                'surface-container-lowest': '#ffffff',
                'on-surface': '#1a1c1c',
                'on-surface-variant': '#454652',
                'outline': '#767683',
                'outline-variant': '#c6c5d4',
                'error': '#ba1a1a',
            },
            fontFamily: {
                // Font kustom sesuai desain
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                headline: ['Manrope', 'sans-serif'],
                label: ['Public Sans', 'sans-serif'],
            },
        },
    },
    plugins: [],
};