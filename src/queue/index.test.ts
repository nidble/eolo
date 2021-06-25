import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'
import queue, { enqueueTask, createQueue, polling } from '.'
import model from '../model'
import { JobQueue } from '../validators/image'

const qname = '42'

describe('Queue factory', () => {
  it('enqueue works', async () => {
    const message = { question: 42 } as unknown as JobQueue
    const redisSMQ = { sendMessageAsync: jest.fn().mockResolvedValue('work!') } as unknown as RedisSMQ
    const method = enqueueTask(redisSMQ, qname)
    await method(message)()

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
    const callback = jest.fn().mockResolvedValue(42)
    const redisSMQ = { popMessageAsync: callback } as unknown as RedisSMQ

    const r = {} as unknown as Redis
    const method = polling(model(r), redisSMQ, qname)
    await method(500, 1)

    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('initialize correctly', () => {
    const redisSMQ = jest.fn() as unknown as RedisSMQ
    const r = {} as unknown as Redis
    const q = queue(model(r), redisSMQ, qname)
    expect(q).toMatchObject({
      enqueueTask: expect.anything(),
      createQueue: expect.anything(),
      polling: expect.anything(),
    })
  })
})
