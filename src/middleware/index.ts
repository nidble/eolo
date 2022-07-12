import polka from 'polka'
import bodyParser from 'body-parser'
import pino from 'pino-http'
import { LOG_LEVEL, UPLOADS_FOLDER } from '@eolo/config'
import multer from 'multer'

const upload = multer({ dest: UPLOADS_FOLDER })

export const logger = pino({ useLevel: LOG_LEVEL })

/**
 * Middleware to handle preflight and CORS
 * @param req
 * @param res
 * @param next
 */
export const cors: polka.Middleware = (req, res, next) => {
  // TODO:
  // restrict CORS headers to best fit project needs
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Request-Method', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT')
  res.setHeader('Access-Control-Allow-Headers', '*')
  req.method === 'OPTIONS' ? res.writeHead(200).end() : next()
}

/**
 * Middleware to handle Json body requests
 * @param req
 * @param res
 * @param next
 */
export const json = bodyParser.json()

/**
 * Middleware to proxy Multer: gracefully return 500 instead to stop server execution
 * @param req
 * @param res
 * @param next
 */
export const uploader: polka.Middleware = (req, res, next) =>
  upload.single('image')(req, res, (err) => (err ? next(err.message) : next()))
