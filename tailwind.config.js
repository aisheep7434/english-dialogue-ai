/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4A90E2',
        'primary-hover': '#357ABD',
        'background': '#FFFFFF',
        'background-alt': '#F7F7F8',
        'border': '#EAEAEA',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'highlight': '#FFF2E0',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}