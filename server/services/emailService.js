// server/services/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter using Mailtrap or another email service
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true // Enable debug logs
});

const sendPasswordResetEmail = async (email, resetToken) => {
  // Se non ci sono le variabili d'ambiente necessarie, restituisci un successo "finto"
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log('Email service not configured, skipping email to:', email);
    return { 
      success: false, 
      messageId: 'email-service-disabled',
      info: 'Email service is not configured properly'
    };
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: {
      name: 'Cliente Admin',
      address: process.env.EMAIL_FROM
    },
    to: email,
    subject: 'Reset della Password - Cliente Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset della Password</h2>
        <p>Hai richiesto il reset della password per il tuo account.</p>
        <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reimposta Password
          </a>
        </div>
        
        <p>Oppure copia e incolla questo link nel tuo browser:</p>
        <p style="background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>
        
        <p><strong>Nota:</strong> Questo link scadrà tra un'ora per motivi di sicurezza.</p>
        <p>Se non hai richiesto il reset della password, puoi ignorare questa email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; 
                    color: #666; font-size: 12px;">
          <p>Questa è un'email automatica, per favore non rispondere.</p>
        </div>
      </div>
    `
  };

  try {
    console.log('Attempting to send password reset email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', {
      messageId: info.messageId,
      recipientEmail: email,
      resetUrl: resetUrl
    });
    return info;
  } catch (error) {
    console.error('Failed to send password reset email:', {
      error: error.message,
      recipientEmail: email,
      stack: error.stack
    });
    // Invece di lanciare un errore, restituisci un oggetto con info sull'errore
    return { 
      success: false, 
      error: true, 
      message: 'Email service unavailable but application will continue'
    };
  }
};

// Verifica la connessione al servizio email all'avvio ma non blocca l'applicazione
let emailServiceAvailable = false;

transporter.verify()
  .then(() => {
    console.log('Email service is ready to send emails');
    emailServiceAvailable = true;
  })
  .catch((error) => {
    console.error('Email service configuration error:', error);
    console.log('Application will continue running without email functionality');
    emailServiceAvailable = false;
  });

module.exports = {
  sendPasswordResetEmail,
  isEmailServiceAvailable: () => emailServiceAvailable
};