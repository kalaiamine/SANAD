/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
            padding: '1rem',
        },
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                'severity-critical': 'var(--severity-critical)',
                'severity-critical-bg': 'var(--severity-critical-bg)',
                'severity-high': 'var(--severity-high)',
                'severity-high-bg': 'var(--severity-high-bg)',
                'severity-medium': 'var(--severity-medium)',
                'severity-medium-bg': 'var(--severity-medium-bg)',
                'severity-low': 'var(--severity-low)',
                'severity-low-bg': 'var(--severity-low-bg)',
                sanad: {
                    primary: '#1F6F78',
                    secondary: '#3BA99C',
                    success: '#2E8B57',
                    warning: '#F4B740',
                    danger: '#D9534F',
                    bg: '#F7FAF9',
                    surface: '#FFFFFF',
                    text: '#24333A',
                    muted: '#6B7A80',
                },
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                sm: 'calc(var(--radius) - 4px)',
                lg: 'var(--radius)',
                xl: 'calc(var(--radius) + 4px)',
                '2xl': 'calc(var(--radius) + 8px)',
                '3xl': 'calc(var(--radius) + 16px)',
            },
            fontFamily: {
                sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
                display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
            },
            boxShadow: {
                card: '0 1px 3px rgba(31,111,120,0.06), 0 4px 16px rgba(31,111,120,0.04)',
                elevated: '0 4px 24px rgba(31,111,120,0.10), 0 1px 4px rgba(31,111,120,0.06)',
                chat: '0 2px 12px rgba(31,111,120,0.12)',
            },
            animation: {
                'spin-slow': 'spin 2s linear infinite',
                'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
};