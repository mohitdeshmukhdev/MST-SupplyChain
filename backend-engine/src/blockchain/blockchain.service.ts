import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { CONTRACT_ABIS } from '../config/evm.config';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  public provider: ethers.JsonRpcProvider;
  public relayerWallet: ethers.Wallet;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('MST_RPC_URL')!;
    // Ethers expects "0x" prefix, if the env doesn't have it, add it safely
    let privateKey = this.configService.get<string>('RELAYER_PRIVATE_KEY')!;
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.relayerWallet = new ethers.Wallet(privateKey, this.provider);

    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.log(`Connected to MST Testnet. Current Block: ${blockNumber}`);
      this.logger.log(`Relayer Wallet Address: ${this.relayerWallet.address}`);
      // Run authorization check in background so it doesn't block startup
      this.ensureRelayerAuthorized();
    } catch (error) {
      this.logger.error('Failed to connect to MST Blockchain', error);
      throw error;
    }
  }

  private async ensureRelayerAuthorized() {
    try {
      const govContract = this.getContract('GovernanceRegistry');
      const identityContract = this.getContract('IdentityRegistry');
      const relayerAddress = this.relayerWallet.address;

      const roles = [
        ethers.id("SUPPLIER_ROLE"),
        ethers.id("LOGISTICS_ROLE"),
        ethers.id("CUSTOMS_ROLE"),
        ethers.id("RETAILER_ROLE"),
        ethers.id("SYSTEM_ROLE")
      ];

      this.logger.log("Checking relayer contract permissions...");
      
      // 1. Grant roles if not already granted
      for (const role of roles) {
        const hasRole = await govContract.hasRole(role, relayerAddress);
        if (!hasRole) {
          this.logger.log(`Granting role ${role} to relayer...`);
          const tx = await govContract.grantRole(role, relayerAddress);
          await tx.wait(1);
          this.logger.log(`Role ${role} granted successfully.`);
        }
      }

      // 2. Verify in IdentityRegistry if not already verified
      const isVerified = await identityContract.isVerified(relayerAddress);
      if (!isVerified) {
        this.logger.log("Verifying relayer identity in IdentityRegistry...");
        const tx = await identityContract.verifyIdentity(
          relayerAddress,
          "MST Relayer Node",
          "TAX-RELAYER",
          "Global",
          "SUPPLIER"
        );
        await tx.wait(1);
        this.logger.log("Relayer identity verified successfully.");
      }
      this.logger.log("Relayer is fully authorized on-chain.");
    } catch (error: any) {
      this.logger.error(`Error ensuring relayer authorization: ${error.message}`);
    }
  }

  /**
   * Returns a ready-to-use Ethers.js contract instance connected to the relayer wallet
   */
  public getContract(name: keyof typeof CONTRACT_ABIS): ethers.Contract {
    let envKey = '';
    switch (name) {
      case 'GovernanceRegistry': envKey = 'GOVERNANCE_REGISTRY'; break;
      case 'IdentityRegistry': envKey = 'IDENTITY_REGISTRY'; break;
      case 'BatchRegistry': envKey = 'BATCH_REGISTRY'; break;
      case 'TelemetryRegistry': envKey = 'TELEMETRY_REGISTRY'; break;
      case 'DocumentRegistry': envKey = 'DOCUMENT_REGISTRY'; break;
      case 'EscrowRegistry': envKey = 'ESCROW_REGISTRY'; break;
      case 'CarbonRegistry': envKey = 'CARBON_REGISTRY'; break;
    }

    const address = this.configService.get<string>(envKey);
    if (!address) {
      throw new Error(`Contract address for ${name} not found in environment`);
    }

    return new ethers.Contract(address, CONTRACT_ABIS[name], this.relayerWallet);
  }
}
