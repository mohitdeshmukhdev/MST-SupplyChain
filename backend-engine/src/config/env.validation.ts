import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Validates all required environment variables at startup.
 * If ANY are missing or invalid, the app crashes immediately
 * with a clear error message — no silent runtime failures.
 */
class EnvironmentVariables {
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;

  @IsString()
  @IsNotEmpty()
  MST_RPC_URL: string;

  @IsString()
  @IsNotEmpty()
  RELAYER_PRIVATE_KEY: string;

  @IsString()
  @IsNotEmpty()
  GOVERNANCE_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  IDENTITY_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  BATCH_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  TELEMETRY_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  DOCUMENT_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  ESCROW_REGISTRY: string;

  @IsString()
  @IsNotEmpty()
  CARBON_REGISTRY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missing = errors.map((e) => e.property).join(', ');
    throw new Error(
      `\n❌ ENV VALIDATION FAILED — Missing or invalid: ${missing}\n` +
        `Check your .env file has all required variables.\n` +
        errors.toString(),
    );
  }

  return validatedConfig;
}
