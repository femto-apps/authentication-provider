module.exports = {
  port: 3001,
  mongo: {
    uri: 'mongodb://localhost:27017/',
    db: 'simple_auth'
  },
  redis: {
    session: 'sessions'
  },
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 4, // 28 days
    secret: 'ezxfgcvSDF4we5ryhfvdfsd;£%£'
  },
  session: {
    secret: 'adstfygjgnfAESRTDYFVB435ryuthf£$%RE;;:'
  }
}