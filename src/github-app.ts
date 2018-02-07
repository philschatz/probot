const jwt = require('jsonwebtoken')

export default function (options: AppOptions) {
  return function () {
    const payload = {
      iat: Math.floor(Date.now() / 1000),       // Issued at time
      exp: Math.floor(Date.now() / 1000) + 60,  // JWT expiration time
      iss: options.id                           // GitHub App ID
    }

    // Sign with RSA SHA256
    return jwt.sign(payload, options.cert, {algorithm: 'RS256'})
  }
}

interface AppOptions {id: number, cert: string}
