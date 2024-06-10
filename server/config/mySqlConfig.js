import mysql from 'mysql';

async function initialize() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'api',
      password: 'api123',
      database: 'logsproxmox'
    });
    console.log('Conectado con éxito');
    return connection;
  } catch (err) {
    console.error(err);
    console.log('Conexión fallida');
    throw err;
  }
}

async function close(connection) {
  try {
    await connection.end();
    console.log('Conexión cerrada');
  } catch (err) {
    console.error(err);
    console.log('Error al cerrar conexión');
  }
}

export { initialize, close };
