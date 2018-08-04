# auth0-idp-webtask
An simple Webtask for accessing Auth0 identity provider APIs from your Auth0-authenticated application.

## Use Case
Your users log in to your application with Facebook via the Auth0 API, and you want to call the Facebook Graph API to fetch the user's Facebook photos.

## Setup
You'll need:

1. An Auth0 application (SPA or Regular Web Application) with which you authenticate your users.

1. An Auth0 *Machine to Machine* application configured to use the Auth0 Management API. Follow all of the setup instructions for **Step 1: Get a Token** here: https://auth0.com/docs/connections/calling-an-external-idp-api#step-1-get-a-token.

1. Note the client IDs and client secrets for both of the applications above, as you'll need them during deployment.

## Deploy
This Webtask is deployed using the wt-cli.
```
$ npm i -g wt-cli
$ wt init
```
For more information about the Webtask CLI, see https://github.com/auth0/wt-cli.

Once it's installed, you can execute the following command to deploy the script.

```
$ wt create index.js /
  -s AUTH0_CLIENT_ID=[your app client ID] /
  -s AUTH0_CLIENT_SECRET=[your app client secret] /
  -s MGMT_CLIENT_ID=[your management API app client ID] /
  -s MGMT_CLIENT_SECRET=[your management API app client service] /
  -s AUTH0_DOMAIN=[your tenant domain] /
  -s AUTH0_SECRET_ENCODING=utf8 /
  --bundle
```
At the end of the output of this command will be the endpoint URL of your deployed Webtask. Note this for later.

> You can access your webtask at the following url:
> https://wt-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-x.auth0-extend.com/auth0-idp-webtask

## Use Your Endpoint
Using fetch to get the Facebook profile of a user who has authenticated with Auth0's Facebook Identity Provider is as easy as making a post request in which:
1. The user's Auth0 token is passed in the `Authorization` header using the `Bearer` strategy.

1. The apiUrl (including any query string values) is passed in the post data.

```
const url = 'https://wt-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-x.auth0-extend.com/auth0-idp-webtask' // Your Webtask URL from the previous step.
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${the user's Auth0 token}`
  },
  body: JSON.stringify({
    apiUrl: 'https://graph.facebook.com/v3.1/me?fields=id,name,about'
  })
}

fetch(url, options)
  .then(data => data.json())
  .then(data => console.log('data:', JSON.stringify(data,0,2)))
```
