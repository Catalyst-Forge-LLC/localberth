import { defineFilepressConfig } from 'getfilepress';

export default defineFilepressConfig({
	title: 'LocalBerth',
	description: 'localhost is the machine. LocalBerth is the slip.',
	url: 'https://localberth.com',
	author: 'Catalyst Forge, LLC',
	tagline: 'Named port leases for a local box',
	lede: 'You still open the port. LocalBerth remembers which name owns which number, shows what’s listening, and keeps the firewall in sync.',
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
