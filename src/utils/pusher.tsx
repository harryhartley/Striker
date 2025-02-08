import type { Channel, PresenceChannel } from 'pusher-js'

import Pusher from 'pusher-js'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { env } from '~/env.mjs'

interface PusherProps {
  slug: string
}

interface PusherState {
  pusherClient: Pusher
  channel: Channel
  presenceChannel: PresenceChannel
  members: Map<string, unknown>
}

const createPusherStore = ({ slug }: PusherProps) => {
  let pusherClient: Pusher
  if (Pusher.instances.length) {
    pusherClient = Pusher.instances[0]!
    pusherClient.connect()
  } else {
    const randomUserId = `random-user-id:${Math.random().toFixed(7)}`
    pusherClient = new Pusher(env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
      authEndpoint: '/api/pusher/auth-channel',
      auth: {
        headers: { user_id: randomUserId },
      },
    })
  }

  const channel = pusherClient.subscribe(slug)

  const presenceChannel = pusherClient.subscribe(
    `presence-${slug}`
  ) as PresenceChannel

  const store = createStore<PusherState>(() => {
    return {
      pusherClient,
      channel,
      presenceChannel,
      members: new Map(),
    }
  })

  const updateMembers = () => {
    store.setState(() => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      members: new Map(Object.entries(presenceChannel.members.members)),
    }))
  }

  presenceChannel.bind('pusher:subscription_succeeded', updateMembers)
  presenceChannel.bind('pusher:member_added', updateMembers)
  presenceChannel.bind('pusher:member_removed', updateMembers)

  return store
}

type PusherStore = ReturnType<typeof createPusherStore>
export const PusherContext = createContext<PusherStore | null>(null)

type PusherProviderProps = React.PropsWithChildren<PusherProps>

export const PusherProvider = ({ slug, children }: PusherProviderProps) => {
  const [store, setStore] = useState<PusherStore>()

  useEffect(() => {
    const newStore = createPusherStore({ slug })
    setStore(newStore)
    return () => {
      const pusher = newStore.getState().pusherClient
      console.log('disconnecting pusher:', pusher)
      console.log(
        '(Expect a warning in terminal after this, React Dev Mode and all)'
      )
      pusher.disconnect()
    }
  }, [slug])

  if (!store) return null

  return (
    <PusherContext.Provider value={store}>{children}</PusherContext.Provider>
  )
}

function usePusherStore<T>(
  selector: (state: PusherState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(PusherContext)
  if (!store) throw new Error('Missing PusherContext.Provider in the tree')
  return useStore(store, selector, equalityFn)
}

export function useSubscribeToEvent<MessageType>(
  eventName: string,
  callback: (data: MessageType) => void
) {
  const channel = usePusherStore((state) => state.channel)

  const stableCallback = useRef(callback)

  useEffect(() => {
    stableCallback.current = callback
  }, [callback])

  useEffect(() => {
    const reference = (data: MessageType) => {
      stableCallback.current(data)
    }
    channel.bind(eventName, reference)
    return () => {
      channel.unbind(eventName, reference)
    }
  }, [channel, eventName])
}

export const useCurrentMemberCount = () => usePusherStore((s) => s.members.size)
