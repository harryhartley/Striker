/* eslint-disable @next/next/no-img-element */
import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { useState } from "react";

// Expected room config:
// Ruleset: Game Name, Best of x?, Legal stages, counterpick stages, banned stages, 
//          number of bans, winnerCharacterLocked?

const Home: NextPage = () => {
  const { user } = useUser()
  
  const socketConfig = {
    p1: user?.username,
    p2: 'Jawdrop'
  }
  const roomConfig = {
    gameName: 'Lethal League Blaze',
    bestOf: 3,
    legalStages: [
      {name: 'Subway', image: 'https://i.imgur.com/TQliTA8.png', width: 'X', height: 'Y'},
      {name: 'Desert', image: 'https://i.imgur.com/RxkSs5N.png', width: 'X', height: 'Y'},
      {name: 'Room', image: 'https://i.imgur.com/TB6KlRK.png', width: 'X', height: 'Y'},
      {name: 'Outskirts', image: 'https://i.imgur.com/R5b6ZNq.png', width: 'X', height: 'Y'},
      {name: 'Streets', image: 'https://i.imgur.com/gSxcB5k.png', width: 'X', height: 'Y'}
    ],
    counterpickStages: [],
    bannedStages: [],
    numberOfBans: 2
  }

  const [selectedStage, setSelectedState] = useState(0)
  
  const [roomState, setRoomState] = useState(3)
  return (
    <>
      <div className="flex items-end space-y-2 pt-4 pb-6 md:space-y-5">
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{socketConfig.p1}</h1>
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">vs</h1>
        <h1 className="flex justify-center flex-1 md:leading-14 text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">{socketConfig.p2}</h1>
      </div>
      {/* Match information: Players, current score */}
        <div></div>

      {/* Ask user who will be going first - us, them, or random
          Confirm correct settings config */}
      {roomState === 0 && 
        <div></div>
      }
      
      {/* Blind character selection */}
      {roomState === 1 && 
        <div></div>
      }
      
      {/* W picks character first, L picks character second */}
      {roomState === 2 && 
        <div></div>
      }
      
      {/* Stage striking */}
      {roomState === 3 && 
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">{socketConfig.p1}: Ban 1 Stage</h2>
          <div className="grid gap-4">
            <div className="relative text-white font-bold">
                <img className="rounded-lg" src={roomConfig.legalStages[selectedStage]?.image} alt={roomConfig.legalStages[selectedStage]?.name}/>
                <div className="text-3xl absolute bottom-2 left-4">{roomConfig.legalStages[selectedStage]?.name}</div>
                <div className="text-3xl absolute bottom-2 right-4">Width: X Height: Y</div>
                <button className="text-4xl bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">BAN</button>
            </div>
            <div className="grid grid-cols-5 gap-4">
                {roomConfig.legalStages.map((stage, idx) => 
                  <img 
                    key={`stage-${idx}`} 
                    className={`rounded-lg ${selectedStage === idx ? 'border-4 border-red-600 rounded-xl' : ''}`} 
                    src={stage.image} 
                    alt={stage.name}
                    onClick={() => setSelectedState(idx)}
                  />
                )}
            </div>
          </div>
        </>
      }

      {/* W bans stages, L picks stage */}
      {roomState === 4 && 
        <div></div>
      }
    </>
  );
};

export default Home;

