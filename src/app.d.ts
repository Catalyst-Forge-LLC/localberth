declare global {
	namespace App {}
}

declare module '*.png' {
	const src: string;
	export default src;
}

export {};
