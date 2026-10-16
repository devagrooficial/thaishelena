import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os modelos HTML das fichas são lidos do disco em tempo de execução.
  outputFileTracingIncludes: {
    "/f/[id]": ["./templates/**/*"],
  },
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
