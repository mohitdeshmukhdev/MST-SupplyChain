const fs = require('fs');
const contracts = ['GovernanceRegistry','IdentityRegistry','BatchRegistry','TelemetryRegistry','DocumentRegistry','EscrowRegistry','CarbonRegistry'];
for (const name of contracts) {
  const p = './artifacts/contracts/' + name + '.sol/' + name + '.json';
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(name + ': ' + data.abi.length + ' ABI entries');
}
