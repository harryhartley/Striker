import { type Character, type $Enums, type RoomStatus } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { type Dispatch, type SetStateAction } from 'react'
import { useSubscribeToEvent } from '~/utils/pusher'
import {
  fallbackCharacter,
  type characterInterface,
  type roomConfigInterface,
} from '~/utils/roomConfigs'
import { bansStringToList } from '~/utils/stageSelect'

export const useEventSubscriptions = (
  refetch: () => unknown,
  roomConfig: roomConfigInterface,
  setStateRoomStatus: Dispatch<SetStateAction<$Enums.RoomStatus>>,
  setStateP1CharacterLocked: (value: SetStateAction<boolean>) => void,
  setStateP2CharacterLocked: (value: SetStateAction<boolean>) => void,
  setStateRoomState: (value: SetStateAction<number>) => void,
  setStateP1Character: (value: SetStateAction<characterInterface>) => void,
  setStateP2Character: (value: SetStateAction<characterInterface>) => void,
  setStateCurrentBans: (value: SetStateAction<number[]>) => void,
  setStateSelectedStage: (value: SetStateAction<number>) => void,
  setStateCurrentScore: (value: SetStateAction<[number, number]>) => void,
  setStateMostRecentWinner: (value: SetStateAction<number>) => void,
  setStateFirstBan: (value: SetStateAction<number>) => void,
  setStateRevertRequested: (value: SetStateAction<number>) => void
) => {
  const { data: session } = useSession()

  useSubscribeToEvent('set-p2-id', () => {
    void refetch()
  })

  useSubscribeToEvent('remove-p2-id', () => {
    void refetch()
  })

  useSubscribeToEvent('set-room-status', (data: { roomStatus: RoomStatus }) => {
    setStateRoomStatus(data.roomStatus)
  })

  useSubscribeToEvent(
    'set-character-locked',
    (data: { playerNumber: number; characterLocked: boolean }) => {
      if (data.playerNumber === 1) {
        setStateP1CharacterLocked(data.characterLocked)
      } else {
        setStateP2CharacterLocked(data.characterLocked)
      }
    }
  )

  useSubscribeToEvent(
    'both-characters-locked',
    (data: { roomState: number }) => {
      setStateRoomState(data.roomState)
      setStateP1CharacterLocked(false)
      setStateP2CharacterLocked(false)
    }
  )

  useSubscribeToEvent('set-room-state', (data: { roomState: number }) => {
    setStateRoomState(data.roomState)
  })

  useSubscribeToEvent(
    'set-character',
    (data: {
      character: Character
      playerNumber: number
      requester: string
    }) => {
      if (session?.user.id !== data.requester) {
        if (data.playerNumber === 1) {
          setStateP1Character(
            roomConfig.legalCharacters.find((x) => x.name === data.character) ??
              fallbackCharacter
          )
        } else {
          setStateP2Character(
            roomConfig.legalCharacters.find((x) => x.name === data.character) ??
              fallbackCharacter
          )
        }
      }
    }
  )

  useSubscribeToEvent(
    'set-current-bans',
    (data: { currentBans: string; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateCurrentBans(bansStringToList(data.currentBans))
      }
    }
  )

  useSubscribeToEvent(
    'set-selected-stage',
    (data: { selectedStage: number; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateSelectedStage(data.selectedStage)
      }
    }
  )

  useSubscribeToEvent(
    'set-current-score',
    (data: { currentScore: string; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateCurrentScore(
          data.currentScore.split(',').map(Number) as [number, number]
        )
      }
    }
  )

  useSubscribeToEvent(
    'set-most-recent-winner',
    (data: { mostRecentWinner: number }) => {
      setStateMostRecentWinner(data.mostRecentWinner)
    }
  )

  useSubscribeToEvent(
    'advance-room-state',
    (data: { roomState: number; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateRoomState(data.roomState)
      }
    }
  )

  useSubscribeToEvent(
    'set-first-ban',
    (data: { firstBan: number; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateFirstBan(data.firstBan)
      }
    }
  )

  useSubscribeToEvent('cancel-room', () => {
    setStateRoomStatus('Canceled')
  })

  useSubscribeToEvent(
    'revert-requested',
    (data: { requesterNumber: number; requester: string }) => {
      if (session?.user.id !== data.requester) {
        setStateRevertRequested(data.requesterNumber)
      }
    }
  )

  useSubscribeToEvent('revert-room', () => {
    void refetch()
  })
}
