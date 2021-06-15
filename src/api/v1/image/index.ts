import { Request, Response } from 'express'
import { Redis } from 'ioredis'

export const post = (redis: Redis) => async (req: Request, res: Response) => {
  try {
    const { fieldname, originalname } = req.file
    const { username } = req.body
    const payload = JSON.stringify({ fieldname, originalname })
    await redis.set(`prefix.${username}`, payload)
  } catch (e) {
    // TODO: return error status and message
    console.log(e)
  } finally {
    res.end()
  }
}
