import { contextBridge } from 'electron';

// Hier später sichere APIs für den Renderer freigeben
contextBridge.exposeInMainWorld('electronAPI', {});
