// Prices are us-east-1 on-demand Linux (approximate). Windows adds ~$0.02–0.05/hr.
export const INSTANCE_TYPES = [
  { value: 't3.micro',   label: 't3.micro',   vcpu: 2,  ram: '1 GB',  pricePerHour: 0.0104 },
  { value: 't3.small',   label: 't3.small',   vcpu: 2,  ram: '2 GB',  pricePerHour: 0.0208 },
  { value: 't3.medium',  label: 't3.medium',  vcpu: 2,  ram: '4 GB',  pricePerHour: 0.0416 },
  { value: 't3.large',   label: 't3.large',   vcpu: 2,  ram: '8 GB',  pricePerHour: 0.0832 },
  { value: 't3.xlarge',  label: 't3.xlarge',  vcpu: 4,  ram: '16 GB', pricePerHour: 0.1664 },
  { value: 't3.2xlarge', label: 't3.2xlarge', vcpu: 8,  ram: '32 GB', pricePerHour: 0.3328 },
  { value: 'm5.large',   label: 'm5.large',   vcpu: 2,  ram: '8 GB',  pricePerHour: 0.096  },
  { value: 'm5.xlarge',  label: 'm5.xlarge',  vcpu: 4,  ram: '16 GB', pricePerHour: 0.192  },
  { value: 'm5.2xlarge', label: 'm5.2xlarge', vcpu: 8,  ram: '32 GB', pricePerHour: 0.384  },
  { value: 'c5.large',   label: 'c5.large',   vcpu: 2,  ram: '4 GB',  pricePerHour: 0.085  },
  { value: 'c5.xlarge',  label: 'c5.xlarge',  vcpu: 4,  ram: '8 GB',  pricePerHour: 0.17   },
  { value: 'r5.large',   label: 'r5.large',   vcpu: 2,  ram: '16 GB', pricePerHour: 0.126  },
];

// gp3 storage price per GB per month
export const STORAGE_PRICE_PER_GB_MONTH = 0.08;

export function estimateCost(instanceType, storageGb, hoursPerMonth = 730) {
  const type = INSTANCE_TYPES.find(t => t.value === instanceType);
  if (!type) return null;
  const instanceMonthly = type.pricePerHour * hoursPerMonth;
  const storageMonthly  = storageGb * STORAGE_PRICE_PER_GB_MONTH;
  return {
    hourly:          type.pricePerHour,
    instanceMonthly,
    storageMonthly,
    totalMonthly:    instanceMonthly + storageMonthly,
  };
}

export const DEFAULT_REGIONS = [
  { value: 'us-east-1',      label: 'US East (N. Virginia)' },
  { value: 'us-east-2',      label: 'US East (Ohio)' },
  { value: 'us-west-1',      label: 'US West (N. California)' },
  { value: 'us-west-2',      label: 'US West (Oregon)' },
  { value: 'eu-west-1',      label: 'EU West (Ireland)' },
  { value: 'eu-west-2',      label: 'EU West (London)' },
  { value: 'eu-central-1',   label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1',     label: 'Asia Pacific (Mumbai)' },
  { value: 'sa-east-1',      label: 'South America (São Paulo)' },
  { value: 'ca-central-1',   label: 'Canada (Central)' },
];

export const OS_OPTIONS = [
  { value: 'ubuntu',        label: 'Ubuntu 22.04 LTS',       icon: '🐧' },
  { value: 'amazon-linux',  label: 'Amazon Linux 2',          icon: '☁️' },
  { value: 'windows',       label: 'Windows Server 2022',     icon: '🪟' },
];

export const STATE_COLORS = {
  running:       '#22c55e',
  stopped:       '#f59e0b',
  pending:       '#a78bfa',
  stopping:      '#f97316',
  terminated:    '#ef4444',
  shutting_down: '#ef4444',
  default:       '#64748b',
};

export function getStateColor(state) {
  return STATE_COLORS[state?.replace('-', '_')] || STATE_COLORS.default;
}
