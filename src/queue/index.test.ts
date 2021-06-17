import RedisSMQ from 'rsmq'
import queue, { sendMessage, createQueue, polling } from '.'

const qname = '42'

describe('Queue factory', () => {
  it('sendMessage works', async () => {
    const message = 'queue works'
    const redisSMQ = { sendMessageAsync: jest.fn() } as unknown as RedisSMQ
    const method = sendMessage(redisSMQ, qname)
    await method(message)

    expect(redisSMQ.sendMessageAsync).toHaveBeenCalledWith({ delay: expect.any(Number), message, qname })
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
    const method = polling(redisSMQ, qname)
    await method(500, 1)

    expect(callback).toBeCalled()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('initialize correctly', () => {
    const redisSMQ = jest.fn() as unknown as RedisSMQ
    const q = queue(redisSMQ, qname)
    expect(q).toMatchObject({
      sendMessage: expect.anything(),
      createQueue: expect.anything(),
      polling: expect.anything(),
    })
  })
})
