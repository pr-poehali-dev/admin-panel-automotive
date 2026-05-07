import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: { '2xl': '1400px' }
		},
		extend: {
			fontFamily: {
				golos: ['Golos Text', 'sans-serif'],
				inter: ['Inter', 'sans-serif'],
				sans: ['Golos Text', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					50: '#eef2ff',
					100: '#e0e7ff',
					200: '#c7d2fe',
					300: '#a5b4fc',
					400: '#818cf8',
					500: '#667eea',
					600: '#4f46e5',
					700: '#4338ca',
					800: '#3730a3',
					900: '#312e81',
				},
				violet: {
					500: '#8b5cf6',
					600: '#7c3aed',
					700: '#6d28d9',
					800: '#5b21b6',
					900: '#4c1d95',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
			},
			backgroundImage: {
				'grad-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'grad-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
				'grad-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
				'grad-warning': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
				'grad-danger': 'linear-gradient(135deg, #ff6b6b 0%, #ee0979 100%)',
				'grad-teal': 'linear-gradient(135deg, #0fd850 0%, #f9f047 100%)',
				'grad-sidebar': 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
				'grad-header': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%)',
				'grad-page': 'linear-gradient(135deg, #f5f7ff 0%, #ede9fe 50%, #fdf2ff 100%)',
			},
			boxShadow: {
				'glow': '0 0 20px rgba(102, 126, 234, 0.4)',
				'glow-lg': '0 0 40px rgba(102, 126, 234, 0.3)',
				'card': '0 4px 24px rgba(102, 126, 234, 0.12)',
				'card-hover': '0 12px 40px rgba(102, 126, 234, 0.25)',
				'sidebar': '4px 0 24px rgba(30, 27, 75, 0.3)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(16px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					from: { opacity: '0', transform: 'translateX(-16px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'shimmer': {
					from: { backgroundPosition: '-200% 0' },
					to: { backgroundPosition: '200% 0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'shimmer': 'shimmer 2s linear infinite',
			},
			transitionDuration: {
				'250': '250ms',
				'350': '350ms',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
