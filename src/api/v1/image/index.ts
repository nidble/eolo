import { Request, Response } from 'express'
import { Redis } from 'ioredis'

type SendMessage = (m: string) => Promise<string>

export const post = (redis: Redis, mq: { sendMessage: SendMessage }) => async (req: Request, res: Response) => {
  try {
    const { fieldname, originalname } = req.file
    const { username } = req.body
    const payload = JSON.stringify({ fieldname, originalname })
    await redis.set(`prefix.${username}`, payload)
    await mq.sendMessage(payload)
  } catch (e) {
    // TODO: return error status and message
    console.log(e)
  } finally {
    res.end()
  }
}
