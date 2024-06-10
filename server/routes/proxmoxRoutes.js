// server\routes\proxmoxRoutes.js
import express from 'express';
import { getProxmoxData } from '../services/proxmoxService.js';

const router = express.Router();

router.get('/data', async (req, res) => {
  try {
    const proxmoxData = await getProxmoxData();
    res.json(proxmoxData);
  } catch (error) {
    console.error('Error al obtener los datos de Proxmox:', error);
    res.status(500).json({ error: 'Error al obtener los datos de Proxmox' });
  }
});

export default router;
