import generateQueryString from 'query-string'

const TRANSAK_URLS = {
  STAGING: 'https://staging-global.transak.com/',
  PRODUCTION: 'https://global.transak.com/'
}

type IEnvironment = 'STAGING' | 'PRODUCTION'

function generateUrl(config: any) {
  const queryParams: any = {}
  let queryString = ''

  if (config && config.apiKey) {
    Object.keys(config).map((key) => {
      if (config[key] instanceof Object) {
        queryParams[key] = JSON.stringify(config[key])
      } else queryParams[key] = config[key]
    })

    queryString = generateQueryString.stringify(queryParams, { arrayFormat: 'comma' })
  } else throw '[Transak SDK] => Please enter your API Key'

  return `${TRANSAK_URLS[(config.environment as IEnvironment) || 'PRODUCTION']}?${queryString}`
}

export { generateUrl }
