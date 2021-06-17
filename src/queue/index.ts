import { setInterval } from 'timers/promises'
import RedisSMQ from 'rsmq'

export const sendMessage = (rsmq: RedisSMQ, qname: string) => (message: string) => {
  const payload = {
    qname,
    message,
    delay: 2,
  }
  return rsmq.sendMessageAsync(payload)
}

// popMessage return also empty object as valid :(, so:
const isValidQueueMessage = (m: {} | RedisSMQ.QueueMessage): m is RedisSMQ.QueueMessage => Object.keys(m).length !== 0

export const createQueue = (rsmq: RedisSMQ, qname: string) => async () => {
  try {
    await rsmq.createQueueAsync({ qname })
  } catch (error) {
    if (error.name !== 'queueExists') {
      console.error(error)
    } else {
      console.log('queue exists.. resuming..')
    }
  }
}

export const polling = (rsmq: RedisSMQ, qname: string) => async (delay: number, cap: number) => {
  let i = 0
  for await (const _startTime of setInterval(delay, Date.now())) {
    try {
      const resp = await rsmq.popMessageAsync({ qname })
      if (isValidQueueMessage(resp)) {
        console.log('received message:', resp.message)
      } else {
        console.log('no available message in queue..')
      }
    } catch (error) {
      console.error(error)
    }
    if (cap >= i) break
    i++
  }
}

export default (rsmq: RedisSMQ, qname: string) => ({
  sendMessage: sendMessage(rsmq, qname),
  createQueue: createQueue(rsmq, qname),
  polling: polling(rsmq, qname),
})
