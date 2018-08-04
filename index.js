import bodyParser from 'body-parser'
import express from 'express'
import fetch from 'node-fetch'
import Webtask from 'webtask-tools'

const getAccessToken = (req, res, next) => {
  const context = req.webtaskContext

  context.storage.get(async (error, data = {}) => {
    if (error) {
      next(error)
      return
    }

    const { accessToken, lastTokenFetch } = data
    const canUseToken = lastTokenFetch && (Date.now() - lastTokenFetch) / 1000 / 60 < 30

    if (accessToken && canUseToken) { req.accessToken = accessToken }

    const { AUTH0_DOMAIN, MGMT_CLIENT_ID, MGMT_CLIENT_SECRET } = context.data
    const url = `https://${AUTH0_DOMAIN}/oauth/token`
    const options = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        'client_id': MGMT_CLIENT_ID,
        'client_secret': MGMT_CLIENT_SECRET,
        'audience': `https://${AUTH0_DOMAIN}/api/v2/`,
        'grant_type': 'client_credentials'
      })
    }

    await fetch(url, options)
      .then(data => data.json())
      .then(data => data.access_token)
      .then(accessToken => {
        req.accessToken = accessToken
        context.storage.set({
          accessToken,
          lastTokenFetch: Date.now()
        }, (error) => {
          if (error) { /* this error is pretty irrelevant */ }
        })
        next()
      })
  })
}

const getIdpToken = (req, res, next) => {
  if (!req.user || !req.accessToken) {
    next()
    return
  }

  const { AUTH0_DOMAIN } = req.webtaskContext.data
  const { sub } = req.user
  const subParts = sub.split('|')
  const accessToken = req.accessToken
  const url = `https://${AUTH0_DOMAIN}/api/v2/users/${sub}`

  req.provider = subParts[0]
  req.userId = subParts[1]

  const options = {
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`
    }
  }

  fetch(url, options)
    .then(data => data.json())
    .then(data => {
      const { access_token = null } = data.identities.find(({provider}) => provider === req.provider)
      req.idpToken = access_token
      next()
    })
}

const callIdp = (req, res, next) => {
  const apiUrl = req.body.apiUrl
  const idpToken = req.idpToken
  const options = {
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${idpToken}`
    }
  }

  fetch(apiUrl, options)
    .then(data => data.json())
    .then(data => {
      res.json(data)
    })
}

const server = express()
  .use(bodyParser.json())
  .post(
    '*',
    getAccessToken,
    getIdpToken,
    callIdp
  )

module.exports = Webtask.fromExpress(server).auth0()
