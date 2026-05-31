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
    } catch (error) {
      this.logger.error('Failed to connect to MST Blockchain', error);
      throw error;
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
