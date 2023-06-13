import { type NextPage } from "next";
import { useState } from "react";

const Home: NextPage = () => {
  // Expected room config:
  // Game Name, 
  // Ruleset: Legal stages, counterpick stages, banned stages, number of bans, winnerCharacterLocked?
  const socketConfig = {
    p1: 'hyhy',
    p2: 'Jawdrop'
  }
  const roomConfig = {
    gameName: 'Lethal League Blaze',
    legalStages: [],
    counterpickStages: [],
    bannedStages: [],
    numberOfBans: 2
  }
  
  const [state, setState] = useState(3)
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
      {state === 0 && 
        <div></div>
      }
      
      {/* Blind character selection */}
      {state === 1 && 
        <div></div>
      }
      
      {/* W picks character first, L picks character second */}
      {state === 2 && 
        <div></div>
      }
      
      {/* Stage striking */}
      {state === 3 && 
        <>
          <h2 className="flex justify-center text-2xl font-bold leading-8 tracking-tight">Ban your choice of stages</h2>
          <div className="grid gap-4">
            <div className="relative text-center text-white">
                <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/RxkSs5N.png" alt=""/>
                <div className=" absolute bottom-2 left-4">Width: X Height: Y</div>
            </div>
            <div className="grid grid-cols-5 gap-4">
                <div>
                    <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/TQliTA8.png" alt="Subway"/>
                </div>
                <div>
                    <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/RxkSs5N.png" alt="Desert"/>
                </div>
                <div>
                    <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/TB6KlRK.png" alt="Room"/>
                </div>
                <div>
                    <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/R5b6ZNq.png" alt="Outskirts"/>
                </div>
                <div>
                    <img className="h-auto max-w-full rounded-lg" src="https://i.imgur.com/gSxcB5k.png" alt="Streets"/>
                </div>
            </div>
          </div>
        </>
      }

      {/* W bans stages, L picks stage */}
      {state === 4 && 
        <div></div>
      }
    </>
  );
};

export default Home;

