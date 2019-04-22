const expressSession = require('express-session')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')(expressSession)
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const flash = require('express-flash')
const mongoose = require('mongoose')
const express = require('express')
const morgan = require('morgan')
const reload = require('reload')
const favicon = require('serve-favicon')
const config = require('@femto-apps/config')

const foreign = require('./modules/foreign')
const login = require('./modules/login')

const consumerServices = require('./services/consumer')

const consumerHandler = require('./handlers/consumer')


;(async () => {
    const app = express()
    const port = config.get('port')

    const db = (await MongoClient.connect(config.get('mongo.uri'), { useNewUrlParser: true })).db(config.get('mongo.db'))
    mongoose.connect(config.get('mongo.uri') + config.get('mongo.db'), { useNewUrlParser: true })
    mongoose.set("useCreateIndex", true)

    app.set('view engine', 'pug')

    app.use(express.static('public'))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser(config.get('cookie.secret') || 'super_secret_123'))
    app.use(expressSession({
        secret: config.get('session.secret') || 'super_secret_123',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ db }),
        name: config.get('cookie.name'),
        cookie: {
            maxAge: config.get('cookie.maxAge'),
        }
    }))
    app.use(flash())

    login.init(app)

    app.use((req, res, next) => {
        res.locals.req = req
        res.locals.development = process.env.NODE_ENV === 'development'
        app.locals.pretty = process.env.NODE_ENV === 'development'
        res.locals.path = req.path
        next()
    })

    app.use(morgan('dev'))

    app.use(favicon(config.get('favicon')))

    app.use((req, res, next) => {
        const links = []

        if (req.user) {
            links.push({ title: 'Logout', href: '/logout' })
        } else {
            links.push({ title: 'Register', href: '/register' })
            links.push({ title: 'Login', href: '/login' })
        }

        res.locals.nav = {
            title: 'Authentication Provider',
            links
        }

        next()
    })

    app.all('/api/v1', (req, res) => res.json("This is the version 1 API route"))
    app.all('/api/v1*', (req, res, next) => {
        console.log(req.path.split('/').splice(0, 3))
        res.redirect('/api/' + req.path.split('/').slice(3, req.path.length).join('/'))
    })

    app.get('/', (req, res) => res.render('home'))
    app.get('/login', (req, res) => res.render('login'))
    app.get('/register', (req, res) => res.render('login'))
    app.get('/logout', login.getLogout)

    app.post('/login', login.postLogin)
    app.post('/register', login.postRegister)

    app.get('/api/consumer', consumerHandler.getConsumers)
    app.get('/api/consumer/:consumerId', consumerHandler.getConsumer)
    app.post('/api/consumer', consumerHandler.postConsumer)
    app.put('/api/consumer/:consumerId', consumerHandler.putConsumer)
    app.delete('/api/consumer/:consumerId', consumerHandler.deleteConsumer)

    app.get('/consumers', async (req, res) => {
        res.render('consumers', {
            page: { title: `Consumer List :: ${config.get('title.suffix')}` },
            consumers: await consumerServices.readConsumers()
        })
    })

    app.get('/api/auth', login.isAuthenticated, foreign.getAuth)

    app.get('/admin', (req, res) => res.sendStatus(501))

    reload(app)

    app.listen(port, () => console.log(`Example app listening on port ${port}`))
})()
