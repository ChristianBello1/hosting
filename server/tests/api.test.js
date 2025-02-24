// tests/api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../index');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const dbHandler = require('./setup');

let adminToken;
let testClientId;

beforeAll(async () => {
 await dbHandler.setUp();
 jest.setTimeout(10000);
});

afterEach(async () => {
 await dbHandler.dropCollections();
});

afterAll(async () => {
 await dbHandler.dropDatabase();
});

describe('API Tests', () => {
 describe('Admin Authentication', () => {
   test('Should register first admin', async () => {
     // Prima verifica che non ci siano admin
     await Admin.deleteMany({});
     
     const res = await request(app)
       .post('/api/auth/admin/register')
       .send({
         name: 'Test Admin',
         email: 'testadmin@test.com',
         password: 'password123',
         role: 'superadmin'
       });
     expect(res.status).toBe(201);
   });

   test('Should login admin', async () => {
     // Assicurati che l'admin esista
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash('password123', salt);
     
     await Admin.create({
       name: 'Test Admin',
       email: 'testadmin@test.com',
       password: hashedPassword,
       role: 'superadmin'
     });

     const res = await request(app)
       .post('/api/auth/admin/login')
       .send({
         email: 'testadmin@test.com',
         password: 'password123'
       });

     expect(res.status).toBe(200);
     expect(res.body.token).toBeDefined();
     adminToken = res.body.token;
   });

   test('Should get admin profile', async () => {
     // Crea un admin e ottieni il token
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash('password123', salt);
     
     const admin = await Admin.create({
       name: 'Test Admin',
       email: 'testadmin@test.com',
       password: hashedPassword,
       role: 'superadmin'
     });

     const loginRes = await request(app)
       .post('/api/auth/admin/login')
       .send({
         email: 'testadmin@test.com',
         password: 'password123'
       });
     adminToken = loginRes.body.token;

     const res = await request(app)
       .get('/api/auth/admin/me')
       .set('Authorization', `Bearer ${adminToken}`);
     expect(res.status).toBe(200);
     expect(res.body._id).toBe(admin._id.toString());
   });
 });

 describe('Client Management', () => {
   beforeEach(async () => {
     // Crea un admin di test e ottieni il token
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash('password123', salt);
     
     await Admin.create({
       name: 'Test Admin',
       email: 'testadmin@test.com',
       password: hashedPassword,
       role: 'superadmin'
     });

     const loginRes = await request(app)
       .post('/api/auth/admin/login')
       .send({
         email: 'testadmin@test.com',
         password: 'password123'
       });
     adminToken = loginRes.body.token;
   });

   test('Should add new client', async () => {
     const res = await request(app)
       .post('/api/auth/clients/add')
       .set('Authorization', `Bearer ${adminToken}`)
       .send({
         companyName: 'Test Company',
         email: 'test@company.com',
         domain: 'testcompany.com'
       });

     expect(res.status).toBe(201);
     expect(res.body.clientDetails).toBeDefined();
     if (res.body.clientDetails._id) {
       testClientId = res.body.clientDetails._id;
     }
   });

   test('Should get client list', async () => {
     // Crea un cliente di test
     await Client.create({
       companyName: 'Test Company',
       email: 'test@company.com',
       domain: 'testcompany.com',
       password: 'hashedpassword'
     });

     const res = await request(app)
       .get('/api/auth/clients')
       .set('Authorization', `Bearer ${adminToken}`);
     expect(res.status).toBe(200);
     expect(Array.isArray(res.body)).toBeTruthy();
   });
 });

 describe('Monitoring System', () => {
   beforeEach(async () => {
     // Crea un admin e ottieni il token
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash('password123', salt);
     
     await Admin.create({
       name: 'Test Admin',
       email: 'testadmin@test.com',
       password: hashedPassword,
       role: 'superadmin'
     });

     const loginRes = await request(app)
       .post('/api/auth/admin/login')
       .send({
         email: 'testadmin@test.com',
         password: 'password123'
       });
     adminToken = loginRes.body.token;

     // Crea un client di test
     const client = await Client.create({
       companyName: 'Test Company',
       email: 'test@company.com',
       domain: 'testcompany.com',
       password: 'hashedpassword'
     });
     testClientId = client._id;
   });

   test('Should get resource metrics', async () => {
     const res = await request(app)
       .get(`/api/monitoring/resources/${testClientId}`)
       .set('Authorization', `Bearer ${adminToken}`);
     expect(res.status).toBe(200);
   });

   test('Should get alerts', async () => {
     const res = await request(app)
       .get('/api/monitoring/alerts')
       .set('Authorization', `Bearer ${adminToken}`);
     expect(res.status).toBe(200);
     expect(Array.isArray(res.body)).toBeTruthy();
   });
 });
});