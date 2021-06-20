/* eslint-disable quotes */
import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { post, index } from '.'

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  time: () => 1234567890,
}))

// const mockSet = jest.fn()
const resMock = () => ({ end: jest.fn(), getHeader: jest.fn(), writeHead: jest.fn() } as unknown as Response)
const baseFile = { originalname: 'bar', path: 'baz', fieldname: 'foo', size: 42 }

describe('Image Api [New]', () => {
  it('return error if no username is specified', async () => {
    const req = { file: {}, body: {} } as unknown as Request
    const res = resMock()
    const mq = { enqueue: jest.fn() }
    const action = post(mq)

    await action(req, res)
    const payload = {
      type: 'Error',
      errors: [
        { message: "required property 'username' as 'undefined' is not valid, should be string", field: 'username' },
      ],
    }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('return error if uploaded file has an invalid field', async () => {
    const req = {
      file: { fieldname: 'foo', size: 42 },
      body: { username: 'client42' },
    } as unknown as Request
    const res = resMock()
    const mq = { enqueue: jest.fn() }
    const action = post(mq)

    await action(req, res)
    const message1 = "required property 'originalname' as 'undefined' is not valid, should be string"
    const message2 = "required property 'mimetype' as 'undefined' is not valid, should be string"
    const message3 = "required property 'path' as 'undefined' is not valid, should be string"
    const payload = {
      type: 'Error',
      errors: [
        { message: message1, field: 'image' },
        { message: message2, field: 'image' },
        { message: message3, field: 'image' },
      ],
    }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
  })
  it('return error if uploaded file has an invalid mimetype', async () => {
    const req = { file: { ...baseFile, mimetype: '' }, body: { username: 'client42' } } as unknown as Request
    const res = resMock()
    const mq = { enqueue: jest.fn() }
    const action = post(mq)

    await action(req, res)
    const message = "required property 'mimetype' as '' is not valid, should be image/jpeg"
    const payload = { type: 'Error', errors: [{ message, field: 'image' }] }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('accept optionally latitude and longitude field', async () => {
    const req = {
      file: { ...baseFile, mimetype: 'image/jpeg' },
      body: { username: 'client42', longitude: 10, latitude: 32 },
    } as unknown as Request
    const res = resMock()
    const mq = { enqueue: jest.fn() }
    const action = post(mq)

    await action(req, res)

    const data = {
      latitude: 32,
      longitude: 10,
      username: 'client42',
      fieldname: 'foo',
      originalname: 'bar',
      mimetype: 'image/jpeg',
      path: 'baz',
      weight: 42,
      timestamp: 1234567890,
      status: 'ACCEPTED',
    }
    const payload = { type: 'Success', data }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
    expect(mq.enqueue).toHaveBeenCalledWith(data)
  })

  it('manage broken field like longitude and latitude', async () => {
    const req = {
      file: { ...baseFile, mimetype: 'image/jpeg' },
      body: { username: 'client42', longitude: 'BROKEN_FIELD' },
    } as unknown as Request
    const res = resMock()
    const mq = { enqueue: jest.fn() }
    const action = post(mq)

    await action(req, res)

    const data = {
      latitude: null,
      longitude: null,
      username: 'client42',
      fieldname: 'foo',
      originalname: 'bar',
      mimetype: 'image/jpeg',
      path: 'baz',
      weight: 42,
      timestamp: 1234567890,
      status: 'ACCEPTED',
    }
    const payload = { type: 'Success', data }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
    expect(mq.enqueue).toHaveBeenCalledWith(data)
  })
})

describe('Image Api [Listing]', () => {
  it('require an username param', async () => {
    const redis = {} as unknown as Redis
    const req = { params: { username: ' ' } } as unknown as Request
    const res = resMock()
    const action = index(redis)

    await action(req, res)
    const error = { message: 'username not valid', field: 'username' }
    const payload = { type: 'Error', errors: [error] }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('return a list of instants', async () => {
    const stub = [
      {
        name: '/a/b/32178.jpg',
        username: 'pluto',
        weight: 683305,
        latitude: null,
        longitude: null,
        timestamp: 1624105228293,
      },
      {
        name: '/a/b/32179.jpg',
        username: 'pluto',
        weight: 683305,
        latitude: null,
        longitude: null,
        timestamp: 1624105232377,
      },
    ]

    const redis = { zrange: jest.fn().mockResolvedValue(stub.map((i) => JSON.stringify(i))) } as unknown as Redis
    const req = { params: { username: 'pippo' } } as unknown as Request
    const res = resMock()
    const action = index(redis)

    await action(req, res)
    const payload = { type: 'Success', data: stub }
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload))
  })
})
