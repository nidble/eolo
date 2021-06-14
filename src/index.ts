import polka from 'polka'
import { json, cors, logger } from './middleware'

const app: polka.Polka = polka()

app.use(logger, json, cors)

app.get('healthz', (_req, res) => res.end())

export default app
