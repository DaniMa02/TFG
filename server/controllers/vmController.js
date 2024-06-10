import { proxmox } from '../config/proxmoxConfig.js';

const createVirtualMachine = async (vmConfig) => {
    const { vmName, pool, kernel, node, iso, network, diskSize, diskStorage, cpuCores, cpuSockets, ramSize } = vmConfig;

    try {
        const nextVmId = await proxmox.cluster.nextid.$get();
        console.log(`Next VM ID: ${nextVmId}`);

        const theNode = proxmox.nodes.$(node);
        const vmConfig = {
            vmid: nextVmId,
            name: vmName,
            numa: 0,
            pool: pool,
            ostype: kernel,
            memory: ramSize * 1024,
            cores: cpuCores,
            sockets: cpuSockets,
            net0: `model=e1000,bridge=${network}`,
            ide2: `${iso},media=cdrom`,
            sata0: `${diskStorage}:${diskSize},cache=writeback`,
            scsihw: 'virtio-scsi-pci',
            agent: 1
        };

        await theNode.qemu.$post({
            node: node,
            ...vmConfig
        });

        console.log(`Máquina virtual ${vmName} (ID: ${nextVmId}) creada correctamente`);

        return nextVmId;
    } catch (error) {
        console.error(`Error al crear la máquina virtual ${vmName}:`, error);
        throw error;
    }
};


const deleteVirtualMachines = async (vms) => {
  try {
    const deletePromises = [];

    for (const { vmid, node } of vms) {
      const theNode = proxmox.nodes.$(node);
      console.log(`Intentando eliminar la máquina virtual ${vmid} del nodo ${node}`);

      const deletePromise = new Promise(async (resolve, reject) => {
        // Verificar el estado de la máquina virtual
        const vmStatus = await theNode.qemu.$(vmid).status.current.$get();
        console.log(`Estado de la máquina virtual ${vmid}: ${vmStatus.status}`);
        // Si la máquina virtual está encendida, apagarla
        if (vmStatus.status === 'running') {
          try {
            await theNode.qemu.$(vmid).status.stop.$post();
            console.log(`Máquina virtual ${vmid} apagada correctamente`);
          } catch (err) {
            console.error(`Error al apagar la máquina virtual ${vmid} del nodo ${node}:`, err);
            reject(err);
            return;
          }
        }

        // Desbloquear la máquina virtual
        const unlockOptions = {
          delete: 'lock',
          skiplock: 1,
        };

        try {
          await theNode.qemu.$(vmid).config.$put(unlockOptions);
          console.log(`Máquina virtual ${vmid} desbloqueada correctamente`);
        } catch (err) {
          console.error(`Error al desbloquear la máquina virtual ${vmid} del nodo ${node}:`, err);
          reject(err);
          return;
        }

        // Eliminar la máquina virtual


        theNode.qemu.$(vmid).$delete((err, data) => {
          if (err) {
            console.error(`Error al eliminar la máquina virtual ${vmid} del nodo ${node}:`, err);
            reject(err);
          } else {
            console.log(`Máquina virtual ${vmid} eliminada correctamente del nodo ${node}`);
            console.log(data);
            resolve(data);
          }
        });
      });

      deletePromises.push(deletePromise);
    }

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error al eliminar las máquinas virtuales:', error);
    throw error;
  }
};

export {deleteVirtualMachines, createVirtualMachine };