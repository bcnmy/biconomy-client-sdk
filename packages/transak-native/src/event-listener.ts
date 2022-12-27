import Pusher from 'pusher-js/react-native'

function eventListener({ apiKey, partnerOrderId }: any, cb: any) {
  const pusher = new Pusher('1d9ffac87de599c61283', { cluster: 'ap2' })
  const channelName = `${apiKey}_${partnerOrderId}`

  pusher.subscribe(channelName)
  pusher.bind_global((event: any, data: any) => {
    if (event !== 'pusher:pong') {
      cb(event, data)
    }
  })

  return {
    unbindListener: () => {
      pusher.unsubscribe(channelName)
      pusher.unbind_global()
    }
  }
}

export { eventListener }
