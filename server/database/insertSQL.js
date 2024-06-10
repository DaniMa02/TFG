import { initialize, close } from '../config/mySqlConfig.js';
import { getProxmoxLogs } from '../services/proxmoxService.js';

async function executeSQL() {
  let conn;
  let result = [];

  try {
    conn = await initialize();

    // Consulta para obtener todos los IDs existentes
    const getIdsQuery = 'SELECT upid FROM logs';
    const existingIds = await new Promise((resolve, reject) => {
      conn.query(getIdsQuery, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Asegurarse de que todos los IDs sean de tipo string para la comparación
          const ids = rows.map(row => row.upid.toString());
          resolve(ids);
        }
      });
    });

    const proxmoxLogs = await getProxmoxLogs();
    if (!Array.isArray(proxmoxLogs)) {
      throw new Error('proxmoxLogs is not an array');
    }
    console.log('Proxmox Logs:', proxmoxLogs);

    // Insertar solo los nuevos registros
    const values = proxmoxLogs
    .filter(log => log.id !== '' && log.saved == 1  && !existingIds.includes(log.upid.toString()))
    .map(log => [log.id, log.user, log.node, log.status, log.saved, log.starttime, log.endtime, log.type, log.upid]);

    if (values.length > 0) {
      const insertQuery = 'INSERT INTO `logs` (`id`, `user`, `node`, `status`, `saved`, `starttime`, `endtime`, `type`, `upid`) VALUES ?';
      await new Promise((resolve, reject) => {
        conn.query(insertQuery, [values], (err, res) => {
          if (err) {
            reject(err);
          } else {
            console.log(`${res.affectedRows} registros insertados correctamente`);
            resolve();
          }
        });
      });
    }


}
   catch (err) {
    console.error('Error al ejecutar la consulta:', err);
  }
  finally {
    if (conn) {
      await close(conn);
    }
  }


  return result;
}

export { executeSQL };
