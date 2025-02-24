// server/middleware/validation.js
const { body, param, validationResult } = require('express-validator');

// Helper per gestire gli errori di validazione
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Validazione per la registrazione admin
const validateAdminRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La password deve essere di almeno 6 caratteri')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una lettera e un numero'),

  // Middleware per gestire gli errori di validazione
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validazione per il login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Validazione per l'aggiunta di un cliente
const validateClientCreation = [
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('domain')
    .trim()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)
    .withMessage('Must be a valid domain name')
    .escape(),
  handleValidationErrors
];

// Validazione per l'aggiornamento del piano
const validatePlanUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid client ID'),
  body('plan')
    .isString()
    .isIn(['standard', 'pro', 'pro_plus'])
    .withMessage('Invalid plan type'),
  body('features')
    .optional()
    .isObject()
    .withMessage('Features deve essere un oggetto valido'),
  handleValidationErrors
];

// Validazione per l'aggiornamento dello stato
const validateStatusUpdate = [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('status')
    .isIn(['active', 'suspended', 'pending'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

// Validazione per il reset password
const validatePasswordReset = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/)
    .withMessage('Password must contain at least one letter and one number'),
  param('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  handleValidationErrors
];


module.exports = {
  validateAdminRegistration,
  validateLogin,
  validateClientCreation,
  validatePlanUpdate,
  validateStatusUpdate,
  validatePasswordReset,
  validateForgotPassword
};