import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: false,
	}
};

export default nextConfig;
