/* eslint-disable quotes */
import { Request } from 'express'
import { Redis } from 'ioredis'
import { saveJob, getInstantsByDate } from '.'
import model from '../../../model'
import { Queue } from '../../../queue'
import { left, right } from 'fp-ts/Either'

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  time: () => 1234567890,
}))

// const mockSet = jest.fn()
// const resMock = () => ({ end: jest.fn(), getHeader: jest.fn(), writeHead: jest.fn() } as unknown as Response)
const baseFile = { originalname: 'bar', path: 'baz', fieldname: 'foo', size: 42 }

describe('Image Api [New]', () => {
  it('return error if no username is specified', async () => {
    const req = { file: {}, body: {} } as unknown as Request
    const mq = { enqueueT: jest.fn() } as unknown as Queue

    const action = saveJob(mq)(req)
    const response = await action()

    const payload = {
      type: 'Error',
      errors: [
        { message: "required property 'username' as 'undefined' is not valid, should be string", scope: 'username' },
      ],
    }
    expect(response).toStrictEqual(left(payload))
  })

  it('return error if uploaded file has an invalid field', async () => {
    const req = {
      file: { fieldname: 'foo', size: 42 },
      body: { username: 'client42' },
    } as unknown as Request
    const mq = { enqueueT: jest.fn() } as unknown as Queue
    const action = saveJob(mq)(req)
    const response = await action()

    const message1 = "required property 'originalname' as 'undefined' is not valid, should be string"
    const message2 = "required property 'mimetype' as 'undefined' is not valid, should be string"
    const message3 = "required property 'path' as 'undefined' is not valid, should be string"
    const payload = {
      type: 'Error',
      errors: [
        { message: message1, scope: 'image' },
        { message: message2, scope: 'image' },
        { message: message3, scope: 'image' },
      ],
    }
    expect(response).toStrictEqual(left(payload))
  })

  it('return error if uploaded file has an invalid mimetype', async () => {
    const req = { file: { ...baseFile, mimetype: '' }, body: { username: 'client42' } } as unknown as Request
    const mq = { enqueueT: jest.fn() } as unknown as Queue
    const action = saveJob(mq)(req)
    const response = await action()

    const message = "required property 'mimetype' as '' is not valid, should be image/jpeg"
    const payload = { type: 'Error', errors: [{ message, scope: 'image' }] }
    expect(response).toStrictEqual(left(payload))
  })

  it('accept optionally latitude and longitude field', async () => {
    const req = {
      file: { ...baseFile, mimetype: 'image/jpeg' },
      body: { username: 'client42', longitude: 10, latitude: 32 },
    } as unknown as Request
    const mq = { enqueueT: jest.fn(() => () => Promise.resolve('fuffi')) } as unknown as Queue
    const action = saveJob(mq)(req)
    const response = await action()

    const data = {
      username: 'client42',
      latitude: 32,
      longitude: 10,
      fieldname: 'foo',
      originalname: 'bar',
      mimetype: 'image/jpeg',
      path: 'baz',
      weight: 42,
      timestamp: 1234567890,
      status: 'ACCEPTED',
    }
    const payload = { type: 'Success', data }
    expect(response).toStrictEqual(right(payload))
    expect(mq.enqueueT).toHaveBeenCalledWith(data)
  })

  it('manage broken field like longitude and latitude', async () => {
    const req = {
      file: { ...baseFile, mimetype: 'image/jpeg' },
      body: { username: 'client42', longitude: 'BROKEN_FIELD' },
    } as unknown as Request
    const mq = { enqueueT: jest.fn(() => () => Promise.resolve('fuffi')) } as unknown as Queue
    const action = saveJob(mq)(req)
    const response = await action()

    const data = {
      username: 'client42',
      latitude: null,
      longitude: null,
      fieldname: 'foo',
      originalname: 'bar',
      mimetype: 'image/jpeg',
      path: 'baz',
      weight: 42,
      timestamp: 1234567890,
      status: 'ACCEPTED',
    }
    const payload = { type: 'Success', data }
    expect(response).toStrictEqual(right(payload))
    expect(mq.enqueueT).toHaveBeenCalledWith(data)
  })
})

describe('Image Api [Listing]', () => {
  it('require an username param', async () => {
    const redis = {} as unknown as Redis
    const m = model(redis)
    const req = { params: { username: ' ' } } as unknown as Request

    const action = getInstantsByDate(m)(req)
    const response = await action()
    const error = {
      message: "required property 'username' as ' ' is not valid, should be not empty",
      scope: 'username',
    }
    const payload = { type: 'Error', errors: [error] }
    expect(response).toStrictEqual(left(payload))
  })

  it('return a list of instants', async () => {
    const stub = [
      {
        weight: 683305,
        timestamp: 1624105228293,
        username: 'pluto',
        latitude: null,
        longitude: null,
        name: '/a/b/32178.jpg',
      },
      {
        weight: 683305,
        timestamp: 1624105232377,
        username: 'pluto',
        latitude: null,
        longitude: null,
        name: '/a/b/32179.jpg',
      },
    ]

    const redis = { zrange: jest.fn().mockResolvedValue(stub.map((i) => JSON.stringify(i))) } as unknown as Redis
    const req = { params: { username: 'pippo' } } as unknown as Request

    const action = getInstantsByDate(model(redis))(req)
    const response = await action()

    const payload = { type: 'Success', data: stub }
    expect(response).toStrictEqual(right(payload))
  })
})
