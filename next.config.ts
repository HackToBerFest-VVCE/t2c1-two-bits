import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ------------------------------------------------------------------
  // Server external packages
  //
  // Tell Next.js not to bundle these packages with webpack — they
  // contain native Node.js modules (bufferutil, utf-8-validate) or
  // use require() in ways that conflict with the webpack bundler.
  // They run fine when imported directly by Node on the server.
  // ------------------------------------------------------------------
  serverExternalPackages: [
    "8004-solana",
    "@solana/web3.js",
    "@coral-xyz/borsh",
    "bufferutil",
    "utf-8-validate",
  ],
};

export default nextConfig;
