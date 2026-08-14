import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더에 다른 프로젝트의 lockfile이 있어서 루트를 명시한다.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
