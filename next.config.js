/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    LONGCAT_API_KEY: process.env.LONGCAT_API_KEY,
  },
}

module.exports = nextConfig
