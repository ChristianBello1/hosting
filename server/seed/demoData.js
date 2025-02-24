// server/seed/demoData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const ResourceAlert = require('../models/ResourceAlert');

async function seedDemoData() {
  console.log('Starting demo data seeding...');
  
  // Crea superadmin se non esiste
  let demoAdmin = await Admin.findOne({ email: 'demo@example.com' });
  if (!demoAdmin) {
    console.log('Creating demo admin account...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);
    
    demoAdmin = await Admin.create({
      name: 'Demo Admin',
      email: 'demo@example.com',
      password: hashedPassword,
      role: 'superadmin'
    });
    
    console.log('Demo admin created successfully');
  }
  
  // Verifica se ci sono già clienti demo
  const clientCount = await Client.countDocuments();
  if (clientCount === 0) {
    console.log('Creating demo clients...');
    
    // Crea clienti di esempio
    const demoClients = [
      {
        companyName: 'Demo Company Alpha',
        email: 'alpha@example.com',
        domain: 'alpha.example.com',
        plan: 'standard',
        siteStatus: 'active'
      },
      {
        companyName: 'Demo Company Beta',
        email: 'beta@example.com',
        domain: 'beta.example.com',
        plan: 'pro',
        siteStatus: 'active'
      },
      {
        companyName: 'Demo Company Gamma',
        email: 'gamma@example.com',
        domain: 'gamma.example.com',
        plan: 'pro_plus',
        siteStatus: 'active'
      },
      {
        companyName: 'Demo Company Delta',
        email: 'delta@example.com',
        domain: 'delta.example.com',
        plan: 'standard',
        siteStatus: 'suspended'
      }
    ];
    
    await Client.insertMany(demoClients);
    console.log(`${demoClients.length} demo clients created successfully`);
    
    // Crea alcuni alert di esempio
    const clients = await Client.find();
    
    for (const client of clients) {
      if (Math.random() > 0.5) {  // Solo per alcuni client
        const alerts = [
          {
            clientId: client._id,
            type: 'cpu',
            message: `Alto utilizzo CPU: 87% (soglia: 80%)`,
            severity: 'medium',
            value: 87,
            threshold: 80
          },
          {
            clientId: client._id,
            type: 'disk',
            message: `Spazio disco quasi esaurito: 92% (soglia: 90%)`,
            severity: 'high',
            value: 92,
            threshold: 90
          }
        ];
        
        if (Math.random() > 0.7) {
          alerts.push({
            clientId: client._id,
            type: 'ram',
            message: `Memoria RAM quasi esaurita: 95% (soglia: 90%)`,
            severity: 'critical',
            value: 95,
            threshold: 90
          });
        }
        
        await ResourceAlert.insertMany(alerts);
      }
    }
    
    console.log('Demo alerts created successfully');
  }
  
  console.log('Demo data seeding completed!');
}

async function resetDemoData() {
  console.log('Resetting demo data...');
  
  // Salva l'admin demo
  const demoAdmin = await Admin.findOne({ email: 'demo@example.com' });
  
  // Elimina tutti i dati tranne l'admin demo
  await Client.deleteMany({});
  await ResourceAlert.deleteMany({});
  
  // Re-seed dei dati
  await seedDemoData();
  
  console.log('Demo data reset completed!');
  return true;
}

module.exports = { seedDemoData, resetDemoData };