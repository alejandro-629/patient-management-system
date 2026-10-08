import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

const patient = {
  firstName: 'End',
  lastName: 'ToEnd',
  email: `e2e-${Date.now()}@example.com`,
  phoneNumber: '+1 555 0199',
  dob: '1988-04-12',
};

describe('Patients API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();

    adminToken = await login('admin@demo.com', 'Admin123!');
    userToken = await login('user@demo.com', 'User123!');
  });

  afterAll(async () => {
    await app.close();
  });

  function http() {
    return request(app.getHttpServer() as App);
  }

  async function login(email: string, password: string): Promise<string> {
    const response = await http().post('/auth/login').send({ email, password });
    return (response.body as { token: string }).token;
  }

  it('logs in and rejects a wrong password with the same 401', async () => {
    const ok = await http()
      .post('/auth/login')
      .send({ email: 'admin@demo.com', password: 'Admin123!' });
    expect(ok.status).toBe(200);
    expect(ok.body.user).toEqual({ email: 'admin@demo.com', role: 'admin' });

    const bad = await http()
      .post('/auth/login')
      .send({ email: 'admin@demo.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe('Invalid email or password');
  });

  it('returns 401 without a token', async () => {
    const response = await http().get('/patients');
    expect(response.status).toBe(401);
  });

  it('returns 403 when a user creates a patient', async () => {
    const response = await http()
      .post('/patients')
      .set('Authorization', `Bearer ${userToken}`)
      .send(patient);
    expect(response.status).toBe(403);
  });

  it('validates the payload', async () => {
    const response = await http()
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...patient, email: 'not-an-email', dob: '2999-01-01' });
    expect(response.status).toBe(400);
  });

  it('lets an admin create, read, update and delete a patient', async () => {
    const created = await http()
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(patient);
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const fetched = await http()
      .get(`/patients/${id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.email).toBe(patient.email);

    const updated = await http()
      .put(`/patients/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...patient, lastName: 'Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.lastName).toBe('Updated');

    const duplicate = await http()
      .post('/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(patient);
    expect(duplicate.status).toBe(409);

    const removed = await http()
      .delete(`/patients/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ ok: true });
  });
});
