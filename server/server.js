import { executeSQL } from './database/insertSQL.js';
import { initWebSocketServer } from './utils/webSocketUtils.js';
import { proxmox } from './config/proxmoxConfig.js';


// Inicializar el servidor WebSocket
initWebSocketServer();

// Función para ejecutar executeSQL cada 10 minutos
const executeSQLPeriodically = () => {
  executeSQL()
    .then(result => {
      // console.log(result); // Imprimir el resultado de la consulta
    })
    .catch(err => {
      console.error(err);
    });
};

const lockVirtualMachine = async (vmid, node) => {
  try {
    const theNode = proxmox.nodes.$(node);
    const options = { lock: 'clone' };

    await theNode.qemu.$(vmid).config.$put(options);
    console.log(`Máquina virtual ${vmid} bloqueada correctamente en el nodo ${node}`);
  } catch (error) {
    console.error(`Error al bloquear la máquina virtual ${vmid} en el nodo ${node}:`, error);
  }
};

const vmid = 107; // ID de la máquina virtual que deseas bloquear
const node = 'pi'; // Nodo donde se encuentra la máquina virtual */

 lockVirtualMachine(vmid, node);

// Ejecutar executeSQL inicialmente
executeSQLPeriodically();

// Configurar para que se ejecute cada 10 minutos (600000 milisegundos)
setInterval(executeSQLPeriodically, 600000); // Cada 10 minutos
