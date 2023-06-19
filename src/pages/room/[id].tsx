/* eslint-disable @next/next/no-img-element */
import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { useState } from "react";

const firstMissingNumber = (current: number[], length: number): number => {
  const currentSorted = current.sort()
  for (let i = 0; i < length; i++) {    
    if (currentSorted[i] != i) return i
  }
  return -1
} 

// Expected room config:
// Ruleset: Game Name, Best of x?, Legal stages, counterpick stages, banned stages, 
//          number of bans, winnerCharacterLocked?

const Home: NextPage = () => {
  const { user } = useUser()
  
  const socketConfig = {
    p0: user?.username,
    p1: 'Jawdrop'
  }
  // const roomConfig = {
  //   gameName: 'Lethal League Blaze',
  //   bestOf: 3,
  //   legalCharacters: [
  //     {name: 'Candyman', image: 'https://i.imgur.com/fiIa0Wp.png'},
  //     {name: 'Dice', image: 'https://i.imgur.com/hVHrBkE.png'},
  //     {name: 'Doombox', image: 'https://i.imgur.com/JI4k9Wo.png'},
  //     {name: 'Dust & Ashes', image: 'https://i.imgur.com/aabjDwX.png'},
  //     {name: 'Grid', image: 'https://i.imgur.com/eAmPWSU.png'},
  //     {name: 'Jet', image: 'https://i.imgur.com/9wRfyzA.png'},
  //     {name: 'Latch', image: 'https://i.imgur.com/3UbnjBP.png'},
  //     {name: 'Nitro', image: 'https://i.imgur.com/ZGD5PqH.png'},
  //     {name: 'Raptor', image: 'https://i.imgur.com/XfzhISG.png'},
  //     {name: 'Sonata', image: 'https://i.imgur.com/o6WcxWD.png'},
  //     {name: 'Switch', image: 'https://i.imgur.com/o9r8z6j.png'},
  //     {name: 'Toxic', image: 'https://i.imgur.com/s9xaYCu.png'},
  //     {name: 'Random', image: 'https://i.imgur.com/mgwDy0f.png', default: true},
  //   ],
  //   legalStages: [
  //     {name: 'Subway', image: 'https://i.imgur.com/TQliTA8.png', width: 'X', height: 'Y'},
  //     {name: 'Desert', image: 'https://i.imgur.com/RxkSs5N.png', width: 'X', height: 'Y'},
  //     {name: 'Room', image: 'https://i.imgur.com/TB6KlRK.png', width: 'X', height: 'Y'},
  //     {name: 'Outskirts', image: 'https://i.imgur.com/R5b6ZNq.png', width: 'X', height: 'Y'},
  //     {name: 'Streets', image: 'https://i.imgur.com/gSxcB5k.png', width: 'X', height: 'Y'},
  //     {name: 'Elevator', image: 'https://i.imgur.com/nRFtIK9.png', width: 'X', height: 'Y'},
  //     {name: 'Factory', image: 'https://i.imgur.com/s4sNwrw.png', width: 'X', height: 'Y'},
  //     {name: 'Pool', image: 'https://i.imgur.com/8xhB7na.png', width: 'X', height: 'Y'},
  //     {name: 'Stadium', image: 'https://i.imgur.com/90N2Yr8.png', width: 'X', height: 'Y'},
  //   ],
  //   counterpickStages: [],
  //   bannedStages: [
  //     {name: 'Streets', image: 'https://i.imgur.com/gf0oKf8.png', width: 'X', height: 'Y'}
  //   ],
  //   numberOfBans: 2
  // }
  const roomConfig = {
    gameName: 'Lethal League Blaze',
    bestOf: 3,
    numberOfBans: 2,
    winnerCharacterLocked: true,
    legalCharacters: [
      {name: 'Candyman', image: 'https://i.imgur.com/fiIa0Wp.png'},
      {name: 'Dice', image: 'https://i.imgur.com/hVHrBkE.png'},
      {name: 'Doombox', image: 'https://i.imgur.com/JI4k9Wo.png'},
      {name: 'Dust & Ashes', image: 'https://i.imgur.com/aabjDwX.png'},
      {name: 'Grid', image: 'https://i.imgur.com/eAmPWSU.png'},
      {name: 'Jet', image: 'https://i.imgur.com/9wRfyzA.png'},
      {name: 'Latch', image: 'https://i.imgur.com/3UbnjBP.png'},
      {name: 'Nitro', image: 'https://i.imgur.com/ZGD5PqH.png'},
      {name: 'Raptor', image: 'https://i.imgur.com/XfzhISG.png'},
      {name: 'Sonata', image: 'https://i.imgur.com/o6WcxWD.png'},
      {name: 'Switch', image: 'https://i.imgur.com/o9r8z6j.png'},
      {name: 'Toxic', image: 'https://i.imgur.com/s9xaYCu.png'},
      {name: 'Random', image: 'https://i.imgur.com/mgwDy0f.png', default: true},
    ],
    legalStages: [
      {name: 'Subway', image: 'https://i.imgur.com/TQliTA8.png', width: 'X', height: 'Y'},
      {name: 'Desert', image: 'https://i.imgur.com/RxkSs5N.png', width: 'X', height: 'Y'},
      {name: 'Room', image: 'https://i.imgur.com/TB6KlRK.png', width: 'X', height: 'Y'},
      {name: 'Outskirts', image: 'https://i.imgur.com/R5b6ZNq.png', width: 'X', height: 'Y'},
      {name: 'Streets', image: 'https://i.imgur.com/gSxcB5k.png', width: 'X', height: 'Y'}
    ],
    counterpickStages: [
      {name: 'Elevator', image: 'https://i.imgur.com/nRFtIK9.png', width: 'X', height: 'Y'},
      {name: 'Pool', image: 'https://i.imgur.com/8xhB7na.png', width: 'X', height: 'Y'},
    ],
    bannedStages: [
      {name: 'Streets', image: 'https://i.imgur.com/gf0oKf8.png', width: 'X', height: 'Y'}
    ],
  }

  const defaultCharacter = roomConfig.legalCharacters.find(x => x.default === true)

  const [currentScore, setCurrentScore] = useState<[number, number]>([0, 0])
  const [p0Character, setP0Character] = useState(defaultCharacter)
  const [p1Character, setP1Character] = useState(defaultCharacter)
  const [characterLocked, setCharacterLocked] = useState(false)
  const [mostRecentWinner, setMostRecentWinner] = useState(-1)
  const [selectedStage, setSelectedStage] = useState(0)
  const [currentBans, setCurrentBans] = useState<number[]>([])
  
  const [roomState, setRoomState] = useState(1)
  return (
    <>
      <div className="flex items-center space-y-2 pt-4 md:space-y-5">
        <img className="flex justify-center flex-1 w-4 max-w-xs" src={p0Character?.image} alt={p0Character?.name}/>
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{socketConfig.p0}</h1>
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">vs</h1>
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{socketConfig.p1}</h1>
        <img className="flex justify-center flex-1 w-4 max-w-xs" src={p1Character?.image} alt={p1Character?.name}/>
      </div>
      <div className="flex items-end justify-center gap-4 space-y-2 pb-6 md:space-y-5">
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{currentScore[0]}</h1>
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">-</h1>
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{currentScore[1]}</h1>
      </div>

      {/* Ask user who will be going first - us, them, or random
          Confirm correct settings config */}
      {roomState === 0 && 
        <div></div>
      }
      
      {/* Blind character selection */}
      {roomState === 1 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">{!characterLocked ? socketConfig.p0 : socketConfig.p1}: Pick your character</h2>
          <div className="grid gap-4">
            <button 
              onClick={() => {
                if (!characterLocked) {
                  setCharacterLocked(true)
                } else { 
                  setRoomState(roomState + 1)
                  setCharacterLocked(false)
                }
              }}
              className="text-4xl bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              LOCK IN
            </button>
            <div className="grid grid-cols-10 gap-4">
                {roomConfig.legalCharacters.map((character, idx) => 
                  <div 
                    onClick={() => {
                      if (!characterLocked) { 
                        setP0Character(character)
                      } else {
                        setP1Character(character)
                      }
                    }} 
                    className="relative" key={`character-${idx}`}
                  >
                    <img 
                      src={character.image} 
                      alt={character.name}
                    />
                  </div>
                )}
            </div>
          </div>
        </>
      }
      
      {/* Stage striking */}
      {roomState === 2 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">{ (((currentBans.length - 1) % 4) + 4) % 4 === 0 || (((currentBans.length - 2) % 4) + 4) % 4 === 0 ? socketConfig.p1 : socketConfig.p0 }: Ban {currentBans.length % 2 === 0 || currentBans.length === roomConfig.legalStages.length - 2 ? '1 stage' : '2 stages'}</h2>
          <div className="grid gap-4">
            <div className="relative text-white font-bold">
                <img className="rounded-lg" src={roomConfig.legalStages[selectedStage]?.image} alt={roomConfig.legalStages[selectedStage]?.name}/>
                <div className="text-3xl absolute bottom-2 left-4">{roomConfig.legalStages[selectedStage]?.name}</div>
                <div className="text-3xl absolute bottom-2 right-4">Width: {roomConfig.legalStages[selectedStage]?.width} Height: {roomConfig.legalStages[selectedStage]?.height}</div>
                <button 
                  onClick={() => {
                    const newBans = [...currentBans, selectedStage]
                    setCurrentBans(newBans)
                    setSelectedStage(firstMissingNumber(newBans, roomConfig.legalStages.length))
                    if (newBans.length === roomConfig.legalStages.length - 1) {
                      setRoomState(roomState + 1)
                      setSelectedStage(firstMissingNumber(newBans, roomConfig.legalStages.length))
                      setCurrentBans([])
                    }
                  }} 
                  className="text-4xl bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">BAN</button>
            </div>
            <div className="grid grid-cols-5 gap-4">
                {roomConfig.legalStages.map((stage, idx) => 
                  <div 
                    onClick={() => {
                      if (!currentBans.includes(idx)) {
                        setSelectedStage(idx)
                      }
                    }} 
                    className="relative" 
                    key={`stage-${idx}`}
                  >
                    <img 
                      className={`rounded-xl border-4 ${selectedStage === idx || currentBans.includes(idx) ? 'border-red-600' : 'border-green-600 cursor-pointer'}`} 
                      src={stage.image} 
                      alt={stage.name}
                    />
                    {currentBans.includes(idx) && 
                      <div className="text-4xl text-red-500 font-bold py-2 px-4 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">BANNED</div>
                    }
                  </div>
                )}
            </div>
          </div>
        </>
      }

      {/* Wait for game result - both players must agree for room */}
      {roomState === 3 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">Game {currentScore[0]+currentScore[1]+1} - Report Score</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setCurrentScore([currentScore[0] + 1, currentScore[1]])
                  setMostRecentWinner(0)
                  if (currentScore[0] === Math.floor(roomConfig.bestOf / 2)) {
                    setRoomState(6)
                  } else { 
                    setRoomState(roomState + 1)
                    if (roomConfig.winnerCharacterLocked) {
                      setCharacterLocked(true)
                    }
                  }
                }}
                className="text-4xl bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {socketConfig.p0}
              </button>
              <button 
                onClick={() => {
                  setCurrentScore([currentScore[0], currentScore[1] + 1])
                  setMostRecentWinner(1)
                  if (currentScore[1] === Math.floor(roomConfig.bestOf / 2)) {
                    setRoomState(6)
                  } else {
                    setRoomState(roomState + 1)
                    if (roomConfig.winnerCharacterLocked) {
                      setCharacterLocked(true)
                    }
                  }
                }}
                className="text-4xl bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {socketConfig.p1}
              </button>
            </div>
            <div className="relative text-white font-bold">
                {/* set the correct stage being played! */}
                <img className="rounded-lg" src={roomConfig.legalStages[selectedStage]?.image} alt={roomConfig.legalStages[selectedStage]?.name}/>
                <div className="text-3xl absolute bottom-2 left-4">{roomConfig.legalStages[selectedStage]?.name}</div>
                <div className="text-3xl absolute bottom-2 right-4">Width: {roomConfig.legalStages[selectedStage]?.width} Height: {roomConfig.legalStages[selectedStage]?.height}</div>
            </div>
          </div>
        </>
      }
      
      {/* W picks character first, L picks character second */}
      {roomState === 4 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            {roomConfig.winnerCharacterLocked ? mostRecentWinner === 0 ? socketConfig.p1 : socketConfig.p0 : mostRecentWinner === 0 ? !characterLocked ? socketConfig.p0 : socketConfig.p1 : !characterLocked ? socketConfig.p1 : socketConfig.p0}: Change your character?
          </h2>
          <div className="grid gap-4">
            <button 
              onClick={() => {
                if (!characterLocked) {
                  setCharacterLocked(true)
                } else { 
                  setRoomState(roomState + 1)
                  setCharacterLocked(false)
                }
              }}
              className="text-4xl bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              LOCK IN
            </button>
            <div className="grid grid-cols-10 gap-4">
                {roomConfig.legalCharacters.map((character, idx) => 
                  <div 
                    onClick={() => {
                      if ((mostRecentWinner === 0 && !characterLocked) || (mostRecentWinner === 1 && characterLocked)) { 
                        setP0Character(character)
                      } else {
                        setP1Character(character)
                      }
                    }} 
                    className="relative" key={`character-${idx}`}
                  >
                    <img 
                      src={character.image} 
                      alt={character.name}
                    />
                  </div>
                )}
            </div>
          </div>
        </>
      }

      {/* W bans stages, L picks stage */}
      {roomState === 5 && 
        <>
          {/* Last night, got the correct number of bans before stage selection */}
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">{(mostRecentWinner === 0 && currentBans.length !== roomConfig.numberOfBans) || (mostRecentWinner === 1 && currentBans.length === roomConfig.numberOfBans) ? socketConfig.p0 : socketConfig.p1}: {currentBans.length === roomConfig.numberOfBans ? 'Pick' : 'Ban'} {roomConfig.numberOfBans === 1 || currentBans.length - roomConfig.numberOfBans === 1 || currentBans.length === roomConfig.numberOfBans ? '1 stage' : `${roomConfig.numberOfBans - currentBans.length} stages`}</h2>
          <div className="grid gap-4">
            <div className="relative text-white font-bold">
                <img className="rounded-lg" src={roomConfig.legalStages[selectedStage]?.image} alt={roomConfig.legalStages[selectedStage]?.name}/>
                <div className="text-3xl absolute bottom-2 left-4">{roomConfig.legalStages[selectedStage]?.name}</div>
                <div className="text-3xl absolute bottom-2 right-4">Width: {roomConfig.legalStages[selectedStage]?.width} Height: {roomConfig.legalStages[selectedStage]?.height}</div>
                <button 
                  onClick={() => {
                    if (currentBans.length === roomConfig.numberOfBans) {
                      setRoomState(roomState - 2)
                      setCurrentBans([])
                    } else {
                      const newBans = [...currentBans, selectedStage]
                      setCurrentBans(newBans)
                      setSelectedStage(firstMissingNumber(newBans, roomConfig.legalStages.length))
                    }
                  }} 
                  className={`text-4xl ${currentBans.length === roomConfig.numberOfBans ? 'bg-green-500 hover:bg-green-700' : 'bg-red-500 hover:bg-red-700'} text-white font-bold py-2 px-4 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
                  >
                    {currentBans.length === roomConfig.numberOfBans ? 'PICK' : 'BAN'}
                </button>
            </div>
            <div className="grid grid-cols-5 gap-4">
                {roomConfig.legalStages.map((stage, idx) => 
                  <div 
                    onClick={() => {
                      if (!currentBans.includes(idx)) {
                        setSelectedStage(idx)
                      }
                    }} 
                    className="relative" 
                    key={`stage-${idx}`}
                  >
                    <img 
                      className={`rounded-xl border-4 ${selectedStage === idx || currentBans.includes(idx) ? 'border-red-600' : 'border-green-600 cursor-pointer'}`} 
                      src={stage.image} 
                      alt={stage.name}
                    />
                    {currentBans.includes(idx) && 
                      <div className="text-4xl text-red-500 font-bold py-2 px-4 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">BANNED</div>
                    }
                  </div>
                )}
            </div>
          </div>
        </>
      }

      {/* If game is over, display final result (and store in database) */}
      {roomState === 6 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">Match Complete</h2>
        </>
      }
    </>
  );
};

export default Home;

