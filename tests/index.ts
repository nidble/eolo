import app from '../src'
import request from 'supertest'

jest.mock('ioredis')

describe('Heathcheck Api', () => {
  it('handle response with 200', async () => {
    const result = await request(app.handler).get('/healthz').send()
    expect(result.status).toBe(200)
  })

  it('handle preflight with 200', async () => {
    const result = await request(app.handler).options('/healthz').send()
    expect(result.status).toBe(200)
  })
})
