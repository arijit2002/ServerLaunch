const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverLaunch', {
  // Auth
  setCredentials:    (creds)  => ipcRenderer.invoke('aws:setCredentials', creds),
  clearCredentials:  ()       => ipcRenderer.invoke('aws:clearCredentials'),

  // Instances
  listInstances:     (region) => ipcRenderer.invoke('aws:listInstances', region),
  startInstance:     (data)   => ipcRenderer.invoke('aws:startInstance', data),
  stopInstance:      (data)   => ipcRenderer.invoke('aws:stopInstance', data),
  rebootInstance:    (data)   => ipcRenderer.invoke('aws:rebootInstance', data),
  terminateInstance: (data)   => ipcRenderer.invoke('aws:terminateInstance', data),

  // Regions / AMI / Launch
  getRegions:        ()       => ipcRenderer.invoke('aws:getRegions'),
  getAmiId:          (data)   => ipcRenderer.invoke('aws:getAmiId', data),
  launchInstance:    (data)   => ipcRenderer.invoke('aws:launchInstance', data),

  // Connect
  copyToClipboard:   (text)   => ipcRenderer.invoke('app:copyToClipboard', text),
  openTerminal:      (data)   => ipcRenderer.invoke('app:openTerminal', data),

  // CloudWatch Metrics
  getMetrics:        (data)   => ipcRenderer.invoke('aws:getMetrics', data),

  // Key Pairs
  listKeyPairs:      (region) => ipcRenderer.invoke('aws:listKeyPairs', region),
  createKeyPair:     (data)   => ipcRenderer.invoke('aws:createKeyPair', data),
  deleteKeyPair:     (data)   => ipcRenderer.invoke('aws:deleteKeyPair', data),

  // Security Groups
  getSecurityGroups: (data)   => ipcRenderer.invoke('aws:getSecurityGroups', data),
});
