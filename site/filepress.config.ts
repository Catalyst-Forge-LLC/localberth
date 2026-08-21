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
		{ label: 'Docs', href: '/docs' },
		{ label: 'Notes', href: '/writing' },
		{ label: 'Install', href: '/install' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' }
	],
	footerLinks: [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Notes', href: '/writing' },
		{ label: 'Install', href: '/install' },
		{ label: 'npm', href: 'https://www.npmjs.com/package/localberth' },
		{ label: 'AppFacts', href: 'https://appfacts.dev/v#af1.eNpNUkuP1DAM_iuRTyClUx63nkAjIR4FCbo3hJCbetts0yTE7sxWo_nvKJmyy9X5Xv6cC5ygea3B40LQgAsGXU9JJtAgW8yzM_UKY1Qvuu7HS9DAgrIyNIBG7IlAg7OGPGfs-4hmourN4dUNaGZoLuDQjyuOGXC3RepMslG06k7khLT6jCf8Nzt2nVbdRM5p9fHuawsa0urFlnTfwkCHBwYN9wkXOoc0QwM3mS9WiuXmrB-zEVp3tn7IiqBhQMEeS8bue2slx54Cyw1c1oarhoEiQ_PzAh4aeMdF-YHruYjHvYwnc3UfkpKJ1IA89QHTAFd94_YkQqniP84Kvd3JkRJbFvKiWELCkYpCDEmUI2TiJ77s8Q3zTt5XU6tYZ2V7RvLjjnjuVtEjmVVs8MXg2H5SXB4Yrr809Kt1Qz5MRDPjSL8X9DhSyhF9XPLpiSV7lgIqM5GZcz2JYmArIW3QwCQSuanr0cq09gcTlvqIgm5jqT6ENFLVtsf6vx91_QtkIdFS' }
	],
	topics: [{ label: 'Notes', tag: 'notes' }],
	paths: [{ url: '/docs', dir: 'docs/dist' }]
});
