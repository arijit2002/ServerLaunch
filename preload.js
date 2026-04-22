const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverLaunch', {
  setCredentials:    (creds)  => ipcRenderer.invoke('aws:setCredentials', creds),
  clearCredentials:  ()       => ipcRenderer.invoke('aws:clearCredentials'),
  listInstances:     (region) => ipcRenderer.invoke('aws:listInstances', region),
  startInstance:     (data)   => ipcRenderer.invoke('aws:startInstance', data),
  stopInstance:      (data)   => ipcRenderer.invoke('aws:stopInstance', data),
  rebootInstance:    (data)   => ipcRenderer.invoke('aws:rebootInstance', data),
  terminateInstance: (data)   => ipcRenderer.invoke('aws:terminateInstance', data),
  getRegions:        ()       => ipcRenderer.invoke('aws:getRegions'),
  getAmiId:          (data)   => ipcRenderer.invoke('aws:getAmiId', data),
  launchInstance:    (data)   => ipcRenderer.invoke('aws:launchInstance', data),
});
