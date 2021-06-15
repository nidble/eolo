import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { post } from '.'

const mockSet = jest.fn()
const mockFile = {
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.of(1234567891011),
  size: 683305,
}
const res = { end() {} } as unknown as Response

describe('Image api works', () => {
  it('save an image for future processing', async () => {
    const fieldname = 'image'
    const originalname = '42.jpg'
    const req = {
      file: { ...mockFile, fieldname, originalname },
      body: { username: 'client42' },
    } as unknown as Request
    const mockRedis = { set: mockSet } as unknown as Redis
    const action = post(mockRedis)

    await action(req, res)

    expect(mockSet).toHaveBeenCalledWith('prefix.client42', JSON.stringify({ fieldname, originalname }))
  })
})
