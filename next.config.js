/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "presigned-collection.s3.amazonaws.com",
				port: "",
				pathname: "/**",
			},
		],
	},
	typescript: {
		ignoreBuildErrors: true, // Ignore TypeScript build errors
	},
	eslint: {
		ignoreDuringBuilds: true, // Disable ESLint during the build process
	},
};

module.exports = nextConfig;
