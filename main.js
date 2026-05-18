const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const cp   = require('child_process');

const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeImagesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  RunInstancesCommand,
  DescribeRegionsCommand,
  DescribeKeyPairsCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  DescribeSecurityGroupsCommand,
} = require('@aws-sdk/client-ec2');

const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

let mainWindow;
let awsCredentials = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 820,
    minWidth: 1000,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f172a',
    show: false,
    title: 'ServerLaunch',
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeEC2(region) {
  if (!awsCredentials) throw new Error('Not authenticated');
  return new EC2Client({
    region: region || 'us-east-1',
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });
}

function makeCloudWatch(region) {
  if (!awsCredentials) throw new Error('Not authenticated');
  return new CloudWatchClient({
    region: region || 'us-east-1',
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });
}

function ok(data)  { return { success: true,  ...data }; }
function fail(err) { return { success: false, error: err.message || String(err) }; }

// ── IPC: Auth ──────────────────────────────────────────────────────────────────

ipcMain.handle('aws:setCredentials', async (_, creds) => {
  try {
    const client = new EC2Client({
      region: 'us-east-1',
      credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    });
    await client.send(new DescribeRegionsCommand({ AllRegions: false }));
    awsCredentials = creds;
    return ok({});
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:clearCredentials', async () => {
  awsCredentials = null;
  return ok({});
});

// ── IPC: Instances ─────────────────────────────────────────────────────────────

ipcMain.handle('aws:listInstances', async (_, region) => {
  try {
    const client = makeEC2(region);
    const res = await client.send(new DescribeInstancesCommand({}));
    const instances = [];
    for (const r of res.Reservations || []) {
      for (const i of r.Instances || []) {
        const nameTag = (i.Tags || []).find(t => t.Key === 'Name');
        instances.push({
          id:        i.InstanceId,
          name:      nameTag?.Value || '(unnamed)',
          state:     i.State?.Name,
          type:      i.InstanceType,
          publicIp:  i.PublicIpAddress || '—',
          privateIp: i.PrivateIpAddress || '—',
          region:    region || 'us-east-1',
          launchTime: i.LaunchTime,
          platform:  i.Platform || 'linux',
          az:        i.Placement?.AvailabilityZone || '—',
          keyName:   i.KeyName || null,
        });
      }
    }
    return ok({ instances });
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:startInstance', async (_, { instanceId, region }) => {
  try {
    await makeEC2(region).send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
    return ok({});
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:stopInstance', async (_, { instanceId, region }) => {
  try {
    await makeEC2(region).send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
    return ok({});
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:rebootInstance', async (_, { instanceId, region }) => {
  try {
    await makeEC2(region).send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
    return ok({});
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:terminateInstance', async (_, { instanceId, region }) => {
  try {
    await makeEC2(region).send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
    return ok({});
  } catch (e) { return fail(e); }
});

// ── IPC: Regions ───────────────────────────────────────────────────────────────

ipcMain.handle('aws:getRegions', async () => {
  try {
    const res = await makeEC2('us-east-1').send(new DescribeRegionsCommand({ AllRegions: false }));
    const regions = (res.Regions || []).map(r => r.RegionName).sort();
    return ok({ regions });
  } catch (e) { return fail(e); }
});

// ── IPC: AMI Lookup ────────────────────────────────────────────────────────────

const AMI_FILTERS = {
  ubuntu: [
    { Name: 'name',                Values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'] },
    { Name: 'owner-id',            Values: ['099720109477'] },
    { Name: 'architecture',        Values: ['x86_64'] },
    { Name: 'virtualization-type', Values: ['hvm'] },
    { Name: 'state',               Values: ['available'] },
  ],
  'amazon-linux': [
    { Name: 'name',                Values: ['amzn2-ami-hvm-2.0.*-x86_64-gp2'] },
    { Name: 'owner-alias',         Values: ['amazon'] },
    { Name: 'architecture',        Values: ['x86_64'] },
    { Name: 'virtualization-type', Values: ['hvm'] },
    { Name: 'state',               Values: ['available'] },
  ],
  windows: [
    { Name: 'name',                Values: ['Windows_Server-2022-English-Full-Base-*'] },
    { Name: 'owner-alias',         Values: ['amazon'] },
    { Name: 'architecture',        Values: ['x86_64'] },
    { Name: 'virtualization-type', Values: ['hvm'] },
    { Name: 'state',               Values: ['available'] },
  ],
};

ipcMain.handle('aws:getAmiId', async (_, { os, region }) => {
  try {
    const filters = AMI_FILTERS[os];
    if (!filters) throw new Error(`Unknown OS: ${os}`);
    const res = await makeEC2(region).send(new DescribeImagesCommand({ Filters: filters }));
    const images = res.Images || [];
    if (images.length === 0) throw new Error(`No AMI found for ${os} in ${region}`);
    images.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));
    return ok({ amiId: images[0].ImageId });
  } catch (e) { return fail(e); }
});

// ── IPC: Launch Instance ───────────────────────────────────────────────────────

ipcMain.handle('aws:launchInstance', async (_, { amiId, instanceType, region, storageSize, name, os, keyPairName }) => {
  try {
    const rootDevice = os === 'windows' ? '/dev/sda1' : '/dev/xvda';
    const params = {
      ImageId:      amiId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      BlockDeviceMappings: [{
        DeviceName: rootDevice,
        Ebs: { VolumeSize: Number(storageSize), VolumeType: 'gp3', DeleteOnTermination: true },
      }],
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [{ Key: 'Name', Value: name || 'ServerLaunch-Instance' }],
      }],
    };
    if (keyPairName) params.KeyName = keyPairName;
    const res = await makeEC2(region).send(new RunInstancesCommand(params));
    return ok({ instanceId: res.Instances[0].InstanceId });
  } catch (e) { return fail(e); }
});

// ── IPC: Connect (SSH/SSM) ─────────────────────────────────────────────────────

ipcMain.handle('app:copyToClipboard', async (_, text) => {
  clipboard.writeText(text);
  return ok({});
});

ipcMain.handle('app:openTerminal', async (_, { command }) => {
  try {
    if (process.platform === 'darwin') {
      const safe = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      cp.exec(`osascript -e 'tell application "Terminal" to do script "${safe}"' -e 'tell application "Terminal" to activate'`);
    } else if (process.platform === 'linux') {
      cp.spawn('x-terminal-emulator', ['-e', command], { detached: true });
    }
    return ok({});
  } catch (e) { return fail(e); }
});

// ── IPC: CloudWatch Metrics ────────────────────────────────────────────────────

ipcMain.handle('aws:getMetrics', async (_, { instanceId, region }) => {
  try {
    const client  = makeCloudWatch(region);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    const fetchMetric = async (MetricName) => {
      const res = await client.send(new GetMetricStatisticsCommand({
        Namespace:  'AWS/EC2',
        MetricName,
        Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
        StartTime:  startTime,
        EndTime:    endTime,
        Period:     3600,
        Statistics: ['Average'],
      }));
      return res.Datapoints.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
    };

    const [cpu, netIn, netOut] = await Promise.all([
      fetchMetric('CPUUtilization'),
      fetchMetric('NetworkIn'),
      fetchMetric('NetworkOut'),
    ]);

    return ok({ cpu, netIn, netOut });
  } catch (e) { return fail(e); }
});

// ── IPC: Key Pairs ─────────────────────────────────────────────────────────────

ipcMain.handle('aws:listKeyPairs', async (_, region) => {
  try {
    const res = await makeEC2(region).send(new DescribeKeyPairsCommand({}));
    const keyPairs = (res.KeyPairs || []).map(kp => ({
      keyPairId:   kp.KeyPairId,
      name:        kp.KeyName,
      fingerprint: kp.KeyFingerprint,
      type:        kp.KeyType || 'rsa',
      createdAt:   kp.CreateTime,
    }));
    return ok({ keyPairs });
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:createKeyPair', async (_, { name, region }) => {
  try {
    const res = await makeEC2(region).send(new CreateKeyPairCommand({ KeyName: name, KeyType: 'rsa' }));
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${name}.pem`,
      filters: [{ name: 'PEM Key File', extensions: ['pem'] }],
      message: 'Save private key — store it safely, AWS will not show it again.',
    });
    if (filePath) {
      fs.writeFileSync(filePath, res.KeyMaterial, { mode: 0o400 });
      return ok({ keyPairId: res.KeyPairId, savedTo: filePath });
    }
    return ok({ keyPairId: res.KeyPairId, savedTo: null });
  } catch (e) { return fail(e); }
});

ipcMain.handle('aws:deleteKeyPair', async (_, { keyPairId, region }) => {
  try {
    await makeEC2(region).send(new DeleteKeyPairCommand({ KeyPairId: keyPairId }));
    return ok({});
  } catch (e) { return fail(e); }
});

// ── IPC: Security Groups ───────────────────────────────────────────────────────

ipcMain.handle('aws:getSecurityGroups', async (_, { instanceId, region }) => {
  try {
    const instRes = await makeEC2(region).send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = instRes.Reservations?.[0]?.Instances?.[0];
    if (!inst) throw new Error('Instance not found');

    const sgIds = (inst.SecurityGroups || []).map(sg => sg.GroupId);
    if (sgIds.length === 0) return ok({ securityGroups: [] });

    const sgRes = await makeEC2(region).send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));

    const mapRules = (perms) => (perms || []).map(p => ({
      protocol: p.IpProtocol === '-1' ? 'All traffic' : p.IpProtocol.toUpperCase(),
      fromPort: p.IpProtocol === '-1' ? null : p.FromPort,
      toPort:   p.IpProtocol === '-1' ? null : p.ToPort,
      sources:  [
        ...(p.IpRanges        || []).map(r => r.CidrIp   + (r.Description ? ` — ${r.Description}` : '')),
        ...(p.Ipv6Ranges      || []).map(r => r.CidrIpv6),
        ...(p.UserIdGroupPairs|| []).map(r => r.GroupId),
      ],
    }));

    const securityGroups = (sgRes.SecurityGroups || []).map(sg => ({
      id:            sg.GroupId,
      name:          sg.GroupName,
      description:   sg.Description,
      inboundRules:  mapRules(sg.IpPermissions),
      outboundRules: mapRules(sg.IpPermissionsEgress),
    }));

    return ok({ securityGroups });
  } catch (e) { return fail(e); }
});
