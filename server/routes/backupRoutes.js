// server/routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const { sendBackupNotification } = require('../services/emailService');
const Client = require('../models/Client');
const mongoose = require('mongoose');

const isInternalRequest = (req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  if (internalKey === process.env.INTERNAL_API_KEY) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized internal request' });
  }
};

router.post('/notify', isInternalRequest, async (req, res) => {
    try {
        const { type, message, clientId } = req.body;

        // Se è una notifica di sistema, procedi senza cercare il cliente
        if (clientId === 'SYSTEM') {
            await sendBackupNotification(type, message, 'SYSTEM', {
                companyName: 'System',
                domain: 'system',
                plan: 'system',
                siteStatus: 'active'
            });
            return res.status(200).json({ success: true });
        }

        // Verifica se l'ID è un ObjectId valido
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            console.log(`ID cliente non valido: ${clientId}`);
            // Invia comunque una notifica di errore
            await sendBackupNotification('ERROR', 
                `Backup fallito - ID cliente non valido: ${clientId}`, 
                clientId, 
                {
                    companyName: 'Unknown',
                    domain: 'unknown',
                    plan: 'unknown',
                    siteStatus: 'error'
                }
            );
            return res.status(400).json({ error: 'ID cliente non valido' });
        }

        // Recupera i dati del cliente dal database
        const client = await Client.findById(clientId);
        if (!client) {
            console.log(`Cliente non trovato: ${clientId}`);
            // Invia una notifica di errore
            await sendBackupNotification('ERROR', 
                `Backup fallito - Cliente non trovato: ${clientId}`, 
                clientId,
                {
                    companyName: 'Not Found',
                    domain: 'not-found',
                    plan: 'unknown',
                    siteStatus: 'error'
                }
            );
            return res.status(404).json({ error: 'Cliente non trovato' });
        }

        // Invia la notifica email con i dati completi del cliente
        await sendBackupNotification(type, message, clientId, client);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Errore notifica backup:', error);
        res.status(500).json({ error: 'Errore invio notifica' });
    }
});

// Endpoint per ottenere il piano del cliente
router.get('/client-plan/:clientId', isInternalRequest, async (req, res) => {
    try {
        const { clientId } = req.params;
  
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({ 
                error: 'ID cliente non valido',
                plan: 'standard' // piano di default in caso di errore
            });
        }
  
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ 
                error: 'Cliente non trovato',
                plan: 'standard' // piano di default in caso di cliente non trovato
            });
        }
  
        res.json({ plan: client.plan });
    } catch (error) {
        console.error('Errore recupero piano cliente:', error);
        res.status(500).json({ 
            error: 'Errore server',
            plan: 'standard' // piano di default in caso di errore
        });
    }
  });

module.exports = router;