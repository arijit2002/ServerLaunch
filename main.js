const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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
} = require('@aws-sdk/client-ec2');


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


function ok(data) { return { success: true, ...data }; }
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
          id: i.InstanceId,
          name: nameTag?.Value || '(unnamed)',
          state: i.State?.Name,
          type: i.InstanceType,
          publicIp: i.PublicIpAddress || '—',
          privateIp: i.PrivateIpAddress || '—',
          region: region || 'us-east-1',
          launchTime: i.LaunchTime,
          platform: i.Platform || 'linux',
          az: i.Placement?.AvailabilityZone || '—',
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

// ── IPC: AMI Lookup (via EC2 DescribeImages — no SSM needed) ──────────────────

const AMI_FILTERS = {
  ubuntu: [
    { Name: 'name',                 Values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'] },
    { Name: 'owner-id',             Values: ['099720109477'] }, // Canonical
    { Name: 'architecture',         Values: ['x86_64'] },
    { Name: 'virtualization-type',  Values: ['hvm'] },
    { Name: 'state',                Values: ['available'] },
  ],
  'amazon-linux': [
    { Name: 'name',                 Values: ['amzn2-ami-hvm-2.0.*-x86_64-gp2'] },
    { Name: 'owner-alias',          Values: ['amazon'] },
    { Name: 'architecture',         Values: ['x86_64'] },
    { Name: 'virtualization-type',  Values: ['hvm'] },
    { Name: 'state',                Values: ['available'] },
  ],
  windows: [
    { Name: 'name',                 Values: ['Windows_Server-2022-English-Full-Base-*'] },
    { Name: 'owner-alias',          Values: ['amazon'] },
    { Name: 'architecture',         Values: ['x86_64'] },
    { Name: 'virtualization-type',  Values: ['hvm'] },
    { Name: 'state',                Values: ['available'] },
  ],
};

ipcMain.handle('aws:getAmiId', async (_, { os, region }) => {
  try {
    const filters = AMI_FILTERS[os];
    if (!filters) throw new Error(`Unknown OS: ${os}`);
    const res = await makeEC2(region).send(new DescribeImagesCommand({ Filters: filters }));
    const images = res.Images || [];
    if (images.length === 0) throw new Error(`No AMI found for ${os} in ${region}`);
    // Pick the newest image by CreationDate
    images.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));
    return ok({ amiId: images[0].ImageId });
  } catch (e) { return fail(e); }
});

// ── IPC: Launch Instance ───────────────────────────────────────────────────────

ipcMain.handle('aws:launchInstance', async (_, { amiId, instanceType, region, storageSize, name, os }) => {
  try {
    const rootDevice = os === 'windows' ? '/dev/sda1' : '/dev/xvda';
    const res = await makeEC2(region).send(new RunInstancesCommand({
      ImageId: amiId,
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
    }));
    return ok({ instanceId: res.Instances[0].InstanceId });
  } catch (e) { return fail(e); }
});
