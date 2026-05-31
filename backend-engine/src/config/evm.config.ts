import * as GovernanceRegistryJson from '../../artifacts/contracts/GovernanceRegistry.sol/GovernanceRegistry.json';
import * as IdentityRegistryJson from '../../artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json';
import * as BatchRegistryJson from '../../artifacts/contracts/BatchRegistry.sol/BatchRegistry.json';
import * as TelemetryRegistryJson from '../../artifacts/contracts/TelemetryRegistry.sol/TelemetryRegistry.json';
import * as DocumentRegistryJson from '../../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json';
import * as EscrowRegistryJson from '../../artifacts/contracts/EscrowRegistry.sol/EscrowRegistry.json';
import * as CarbonRegistryJson from '../../artifacts/contracts/CarbonRegistry.sol/CarbonRegistry.json';

export const CONTRACT_ABIS = {
  GovernanceRegistry: GovernanceRegistryJson.abi,
  IdentityRegistry: IdentityRegistryJson.abi,
  BatchRegistry: BatchRegistryJson.abi,
  TelemetryRegistry: TelemetryRegistryJson.abi,
  DocumentRegistry: DocumentRegistryJson.abi,
  EscrowRegistry: EscrowRegistryJson.abi,
  CarbonRegistry: CarbonRegistryJson.abi,
};

export const DEFRA_FACTORS: Record<string, number> = {
  DIESEL_TRUCK_HGV: 0.2076,
  REFRIGERATED_TRUCK: 0.2572,
  VAN_DIESEL: 0.3079,
  ELECTRIC_TRUCK: 0.0685,
  CARGO_SHIP: 0.0138,
  AIR_FREIGHT: 1.0200,
};

// Contract Addresses are pulled dynamically from process.env via ConfigService
// This file just houses static metadata (ABIs, Enums, Constants)
