// server/routes/auth.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const deploymentService = require('../services/deployment.js');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');
const enhancedAuth = require('../middleware/enhancedAuth');
const {
  validateAdminRegistration,
  validateLogin,
  validateClientCreation,
  validatePlanUpdate,
  validateStatusUpdate,
  validatePasswordReset,
  validateForgotPassword
} = require('../middleware/validation');
const logger = require('../logger');

// Admin Registration - Modificata per gestire meglio il primo admin
router.post('/admin/register', validateAdminRegistration, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Verifica se è il primo admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      // Se è il primo admin, lo creiamo come superadmin senza richiedere autenticazione
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const admin = new Admin({
        email,
        password: hashedPassword,
        name,
        role: 'superadmin'
      });

      await admin.save();
      return res.status(201).json({ message: 'First admin created successfully' });
    } else {
      // Se non è il primo admin, verifica l'autenticazione e il ruolo
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Only existing admins can register new admins' });
      }

      try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const requestingAdmin = await Admin.findById(verified.id);
        
        if (!requestingAdmin || requestingAdmin.role !== 'superadmin') {
          return res.status(401).json({ message: 'Only superadmins can register new admins' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new Admin({
          email,
          password: hashedPassword,
          name,
          role: 'admin' // Nuovi admin creati sono sempre 'admin' normali
        });

        await newAdmin.save();
        return res.status(201).json({ message: 'New admin created successfully' });
      } catch (error) {
        return res.status(401).json({ message: 'Invalid authentication token' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/admin/login', validateLogin, async (req, res) => {
  logger.info('LOGIN ROUTE - DEBUG COMPLETO:', {
    body: JSON.stringify(req.body),
    headers: JSON.stringify(req.headers),
    origin: req.get('origin'),
    referrer: req.get('referrer')
  });
  try {
    logger.info('Tentativo di login ricevuto:', {
      email: req.body.email,
      headers: req.headers,
      origin: req.get('origin')
    });
    console.time('login-operation');
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    console.time('find-admin');
    const admin = await Admin.findOne({ email });
    console.timeEnd('find-admin');
    console.log('Admin found:', admin ? 'Yes' : 'No');

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.time('password-compare');
    const validPassword = await bcrypt.compare(password, admin.password);
    console.timeEnd('password-compare');
    console.log('Password valid:', validPassword ? 'Yes' : 'No');
    
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.time('jwt-sign');
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.timeEnd('jwt-sign');
    
    console.timeEnd('login-operation');
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    logger.error('Errore dettagliato nel login:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: error.message });
  }
});

// Client Management - Modificato per gestire meglio gli errori di deployment
router.post('/clients/add', [enhancedAuth, validateClientCreation], async (req, res) => {
  try {
    const { companyName, email, domain } = req.body;
    
    const clientExists = await Client.findOne({ 
      $or: [{ email }, { domain }] 
    });
    if (clientExists) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const client = new Client({
      companyName,
      email,
      password: hashedPassword,
      domain,
      plan: 'standard',
      siteStatus: 'creating'
    });

    await client.save();

    try {
      const deploymentResult = await deploymentService.initializeClientSite(client);
      
      // Aggiorna lo stato del client dopo un deployment riuscito
      await Client.findByIdAndUpdate(client._id, {
        siteStatus: 'active',
        siteUrl: deploymentResult.url
      });

      res.status(201).json({ 
        message: 'Client added successfully',
        clientDetails: {
          ...client.toObject(),
          tempPassword,
          siteUrl: deploymentResult.url
        }
      });
    } catch (deployError) {
      // Aggiorna lo stato del client in caso di errore nel deployment
      await Client.findByIdAndUpdate(client._id, {
        siteStatus: 'deployment_failed',
        lastError: deployError.message
      });

      res.status(201).json({ 
        message: 'Client added but deployment failed',
        clientDetails: {
          ...client.toObject(),
          tempPassword,
          deploymentError: deployError.message
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current Admin Info
router.get('/admin/me', enhancedAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all clients
router.get('/clients', enhancedAuth, async (req, res) => {
  try {
    const clients = await Client.find().select('-password');
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update client status
router.patch('/clients/:id/status', [enhancedAuth, validateStatusUpdate], async (req, res) => {

  try {
    const { status } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        siteStatus: status,
        lastUpdate: Date.now()
      },
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update client plan
router.patch('/clients/:id/plan', [enhancedAuth, validatePlanUpdate], async (req, res) => {
  try {
    console.log('Plan update request:', {
      clientId: req.params.id,
      newPlan: req.body.plan
    });

    const { plan } = req.body;

    // Validazione piano
    if (!['standard', 'pro', 'pro_plus'].includes(plan)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid plan type'
      });
    }

    // Trova il cliente e verifica che esista
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found'
      });
    }

    // Aggiorna il piano
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        plan,
        lastUpdate: Date.now()
      },
      { new: true }
    );

    console.log('Plan updated successfully:', {
      clientId: req.params.id,
      oldPlan: client.plan,
      newPlan: plan
    });

    res.json({
      status: 'success',
      message: 'Plan updated successfully',
      client: updatedClient
    });

  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update plan',
      error: error.message 
    });
  }
});

// Route pagina dettaglio
router.get('/clients/:id', enhancedAuth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Per sicurezza, non rivelare che l'email non esiste
      return res.status(200).json({
        message: 'Se questa email è registrata, riceverai le istruzioni per il reset.'
      });
    }

    // Genera il token di reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 ora

    // Salva il token nell'account admin
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = tokenExpiry;
    await admin.save();

    // Invia l'email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      message: 'Email di reset inviata con successo.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Errore nell\'invio dell\'email di reset' });
  }
});

// Aggiungi questa route dopo la route 'forgot-password'
router.post('/demo-forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    // Genera il token di reset (indipendentemente se l'utente esiste o no)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 ora

    // Se l'utente esiste, salva il token
    if (admin) {
      admin.resetPasswordToken = resetToken;
      admin.resetPasswordExpires = tokenExpiry;
      await admin.save();
    }

    // Restituisci direttamente il token all'applicazione frontend 
    // NOTA: questo è solo per scopi dimostrativi!
    res.status(200).json({
      success: true,
      message: 'Reset token generato con successo (solo per demo)',
      resetToken: resetToken,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
      note: 'In un ambiente di produzione, questo token verrebbe inviato via email, non restituito nell\'API'
    });
  } catch (error) {
    console.error('Demo password reset error:', error);
    res.status(500).json({ message: 'Errore nella generazione del token di reset' });
  }
});

// Reset Password
router.post('/reset-password/:token', validatePasswordReset, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    console.log('Reset password request received. Token:', token);
    console.log('Password length:', password?.length || 0);

    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    console.log('Admin found:', admin ? 'Yes' : 'No');
    if (admin) {
      console.log('Admin email:', admin.email);
      console.log('Token expiry:', new Date(admin.resetPasswordExpires).toISOString());
    }

    if (!admin) {
      return res.status(400).json({
        message: 'Token di reset non valido o scaduto.'
      });
    }

    // Hash della nuova password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Aggiorna la password e rimuovi il token di reset
    console.log('Updating password for admin:', admin.email);
    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    
    const result = await admin.save();
    console.log('Password update result:', result ? 'Success' : 'Failed');

    res.status(200).json({
      message: 'Password aggiornata con successo.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Errore nel reset della password' });
  }
});

// redeploy
router.post('/clients/:id/redeploy', [enhancedAuth], async (req, res) => {
  try {
    console.log('Redeploy request received for client:', req.params.id);

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Client not found' 
      });
    }

    // Aggiorna lo stato
    await Client.findByIdAndUpdate(client._id, {
      siteStatus: 'deploying',
      lastUpdate: new Date()
    });

    try {
      const result = await deploymentService.redeployClient(req.params.id);
      
      // Aggiorna lo stato a success
      await Client.findByIdAndUpdate(client._id, {
        siteStatus: 'active',
        lastUpdate: new Date()
      });

      res.json({
        status: 'success',
        message: 'Site redeployed successfully',
        details: result
      });

    } catch (error) {
      // Se fallisce, imposta lo stato su failed
      await Client.findByIdAndUpdate(client._id, {
        siteStatus: 'deployment_failed',
        lastUpdate: new Date()
      });

      throw error;
    }

  } catch (error) {
    console.error('Redeploy error:', {
      clientId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to redeploy site'
    });
  }
});

module.exports = router;