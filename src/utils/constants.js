export const INSTANCE_TYPES = [
  { value: 't3.micro',   label: 't3.micro   —  2 vCPU /  1 GB RAM' },
  { value: 't3.small',   label: 't3.small   —  2 vCPU /  2 GB RAM' },
  { value: 't3.medium',  label: 't3.medium  —  2 vCPU /  4 GB RAM' },
  { value: 't3.large',   label: 't3.large   —  2 vCPU /  8 GB RAM' },
  { value: 't3.xlarge',  label: 't3.xlarge  —  4 vCPU / 16 GB RAM' },
  { value: 't3.2xlarge', label: 't3.2xlarge —  8 vCPU / 32 GB RAM' },
  { value: 'm5.large',   label: 'm5.large   —  2 vCPU /  8 GB RAM' },
  { value: 'm5.xlarge',  label: 'm5.xlarge  —  4 vCPU / 16 GB RAM' },
  { value: 'm5.2xlarge', label: 'm5.2xlarge —  8 vCPU / 32 GB RAM' },
  { value: 'c5.large',   label: 'c5.large   —  2 vCPU /  4 GB RAM' },
  { value: 'c5.xlarge',  label: 'c5.xlarge  —  4 vCPU /  8 GB RAM' },
  { value: 'r5.large',   label: 'r5.large   —  2 vCPU / 16 GB RAM' },
];

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
