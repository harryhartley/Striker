import Image from "next/image";
import type { characterInterface } from "~/utils/roomConfigs";

interface ScoreboardProps {
  p1Name: string | null;
  p2Name: string | null | undefined;
  p1Character: characterInterface;
  p2Character: characterInterface;
  currentScore: [number, number];
}

export const Scoreboard = ({
  p1Name,
  p2Name,
  p1Character,
  p2Character,
  currentScore,
}: ScoreboardProps) => {
  return (
    <>
      <div className="flex items-end justify-center space-y-2 pt-4 md:space-y-5">
        <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {p1Name}
        </div>
        <Image
          className="flex w-1/12 max-w-xs justify-center"
          src={p1Character?.image}
          alt={p1Character?.name}
          width={128}
          height={128}
        />
        <div className="md:leading-14 flex w-1/12 justify-center text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          vs
        </div>
        <Image
          className="flex w-1/12 max-w-xs justify-center"
          src={p2Character?.image}
          alt={p2Character?.name}
          width={128}
          height={128}
        />
        <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {p2Name}
        </div>
      </div>
      <div className="flex items-end justify-center gap-4 space-y-2 pb-6 md:space-y-5">
        <h1 className="md:leading-14 text-xl  leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {currentScore[0]}
        </h1>
        <h1 className="md:leading-14 text-xl  leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          -
        </h1>
        <h1 className="md:leading-14 text-xl  leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {currentScore[1]}
        </h1>
      </div>
    </>
  );
};
