// server/test/emailTest.js
const { sendBackupNotification } = require('../services/emailService');

async function testEmail() {
  try {
    await sendBackupNotification(
      'TEST',
      'Questo è un messaggio di test del sistema email',
      'TEST_CLIENT',
      {
        companyName: 'Test Company',
        domain: 'test.com',
        plan: 'standard',
        siteStatus: 'active'
      }
    );
    console.log('Email inviata con successo!');
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
  }
}

testEmail();