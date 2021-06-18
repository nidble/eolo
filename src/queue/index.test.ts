import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'
import queue, { enqueue, createQueue, polling } from '.'
import { Job } from '../../types'

const qname = '42'

describe('Queue factory', () => {
  it('enqueue works', async () => {
    const message = { question: 42 } as unknown as Job
    const redisSMQ = { sendMessageAsync: jest.fn() } as unknown as RedisSMQ
    const method = enqueue(redisSMQ, qname)
    await method(message)

    expect(redisSMQ.sendMessageAsync).toHaveBeenCalledWith({
      delay: expect.any(Number),
      message: JSON.stringify(message),
      qname,
    })
  })

  it('createQueue works', async () => {
    const redisSMQ = { createQueueAsync: jest.fn() } as unknown as RedisSMQ
    const method = createQueue(redisSMQ, qname)
    await method()

    expect(redisSMQ.createQueueAsync).toHaveBeenCalledWith({ qname })
  })

  it('polling works', async () => {
    const callback = jest.fn()
    const redisSMQ = { popMessageAsync: callback } as unknown as RedisSMQ

    const r = {} as unknown as Redis
    const method = polling(r, redisSMQ, qname)
    await method(500, 1)

    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('initialize correctly', () => {
    const redisSMQ = jest.fn() as unknown as RedisSMQ
    const r = {} as unknown as Redis
    const q = queue(r, redisSMQ, qname)
    expect(q).toMatchObject({
      enqueue: expect.anything(),
      createQueue: expect.anything(),
      polling: expect.anything(),
    })
  })
})
