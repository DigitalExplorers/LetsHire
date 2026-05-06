import type { NextConfig } from "next";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the monorepo root .env.
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const region = process.env.AWS_REGION;
const bucket_name = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
const s3Hostname = region && bucket_name ? `${bucket_name}.s3.${region}.amazonaws.com` : '';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      ...(s3Hostname
        ? [{ protocol: 'https' as const, hostname: s3Hostname }]
        : []),
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/org-assets/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
