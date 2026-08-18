import { defineFilepressConfig } from 'getfilepress';

export default defineFilepressConfig({
	title: 'LocalBerth',
	description: 'Local DNS for ports.',
	url: 'https://localberth.com',
	author: 'Catalyst Forge, LLC',
	tagline: 'Local DNS for ports',
	lede: 'Vite hands out 5173, then 5174. Reboot, and they swap. Name the port so they do not.',
	logo: '/logo.png',
	ogImage: '/logo.png',
	homePage: 'home',
	nav: [
		{ label: 'Home', href: '/' },
		{ label: 'Notes', href: '/writing' },
		{ label: 'Install', href: '/install' },
		{ label: 'CLI', href: '/cli' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' }
	],
	footerLinks: [
		{ label: 'Notes', href: '/writing' },
		{ label: 'Install', href: '/install' },
		{ label: 'CLI', href: '/cli' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' }
	],
	topics: [{ label: 'Notes', tag: 'notes' }]
});
