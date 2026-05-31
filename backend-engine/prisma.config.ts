import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

// Prisma v7 — DATABASE_URL must be declared here for migrate to work
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
