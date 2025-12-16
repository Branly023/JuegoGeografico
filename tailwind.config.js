/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'], // Keep mono for code/stats if needed
            },
            colors: {
                night: '#0B1020',
                deep: '#121A33',
                'soft-white': '#F5F7FA',
                'soft-gray': '#B8C0E0',
                brand: {
                    europe: '#3B82F6',   // Blue
                    americas: '#22C55E', // Green
                    africa: '#F59E0B',   // Orange
                    asia: '#EF4444',     // Red
                    oceania: '#8B5CF6',  // Purple
                },
                status: {
                    success: '#22C55E',
                    error: '#EF4444',
                    warning: '#F97316',
                    neutral: '#64748B',
                }
            }
        },
    },
    plugins: [],
}
