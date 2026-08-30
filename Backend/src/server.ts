import fastify from 'fastify'
import dotenv from 'dotenv'

dotenv.config()

const app = fastify({logger: true})

app.get('/health', async () => {
    return {status: 'vivinho da silva'}
})

const PORT = Number(process.env.PORT) ?? 3333

app.listen({port: PORT, host: '0.0.0.0'}, (err) => {
    if(err) {
        app.log.error(err)
        process.exit(1)
    }
})

export default app