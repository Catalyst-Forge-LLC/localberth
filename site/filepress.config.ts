import { defineFilepressConfig } from 'getfilepress';

export default defineFilepressConfig({
	title: 'LocalBerth',
	description: 'Local DNS for ports.',
	url: 'https://localberth.com',
	author: 'Catalyst Forge, LLC',
	tagline: 'Local DNS for ports',
	lede: 'Named port leases for a local box. You still open the port.',
	homePage: 'home',
	nav: [
		{ label: 'Home', href: '/' },
		{ label: 'Install', href: '/install' },
		{ label: 'CLI', href: '/cli' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' }
	],
	footerLinks: [
		{ label: 'Install', href: '/install' },
		{ label: 'CLI', href: '/cli' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' }
	],
	topics: [{ label: 'Notes', tag: 'notes' }]
});
