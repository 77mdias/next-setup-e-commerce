import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'u9a6wmr3as.ufs.sh', // Para imagens de exemplo
			},
			// Adicione aqui outros domínios de imagens que você usar
		],
	},
};

export default nextConfig;
