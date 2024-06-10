import { proxmox } from "../config/proxmoxConfig.js";
import commonKernels from '../utils/constants.js';


async function getProxmoxLogs() {
  try {
    // Autenticarse
    const connection = proxmox;
    console.log('Conexión exitosa a Proxmox.');

    // Obtener logs
    const logs = await connection.cluster.tasks.$get(); // Reemplaza 'node_name' con el nombre de tu nodo

    // Mapear los logs a la estructura que necesitas
    const formattedLogs = logs.map(log => ({
      id: log.id,
      type: log.type,
      starttime: log.starttime,
      status: log.status,
      endtime: log.endtime,
      saved: log.saved,
      node: log.node,
      user: log.user,
      upid: log.upid
    }));
    return formattedLogs;


  } catch (error) {
    console.error('Error al obtener los logs de Proxmox:', error);
    return [];
  }
}

async function getProxmoxData() {
  try {
    const pools = await proxmox.pools.$get();
    const nodes = await proxmox.nodes.$get();
    const allNetworks = await proxmox.nodes.localhost.network.$get();
    const networks = allNetworks.filter(network => network.type === 'bridge');

    const nodesWithStorage = await Promise.all(
      nodes.map(async node => {
        const theNode = proxmox.nodes.$(node.node);
        const storage = await theNode.storage.$get();
        const storageWithIsos = await Promise.all(
          storage.map(async storageItem => {
            const isos = await theNode.storage.$(storageItem.storage).content.$get();
            const isosFiltered = isos.filter(iso => iso.format === 'iso');
            return { ...storageItem, isos: isosFiltered };
          })
        );
        return { ...node, storage: storageWithIsos };
      })
    );

    return {
      pools,
      kernels: commonKernels, // Asumiendo que commonKernels es una constante definida en otro lugar
      nodes: nodesWithStorage,
      networks
    };
  } catch (error) {
    console.error('Error al obtener los datos de Proxmox:', error);
    throw error;
  }
}

async function getVirtualMachines() {
  try {
    const nodes = await proxmox.nodes.$get();
    const virtualMachines = await Promise.all(
      nodes.map(async (node) => {
        const theNode = proxmox.nodes.$(node.node);
        const vms = await theNode.qemu.$get();
        return vms.map((vm) => ({
          ...vm,
          node: node.node,
        }));
      })
    );

    return virtualMachines.flat();
  } catch (error) {
    console.error("Error al obtener las máquinas virtuales:", error);
    throw error;
  }
}




export { getProxmoxLogs, getProxmoxData, getVirtualMachines };
