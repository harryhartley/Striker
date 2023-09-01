/* eslint-disable @next/next/no-img-element */
import { type Character, type RoomStatus } from "@prisma/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Scoreboard } from "~/components/room/Scoreboard";
import { api } from "~/utils/api";
import { PusherProvider, useSubscribeToEvent } from "~/utils/pusher";
import {
  fallbackCharacter,
  getConfigById,
  type roomConfigInterface,
} from "~/utils/roomConfigs";

const bansStringToList = (bans: string): number[] => {
  if (bans === "") return [];
  return bans.split(",").map(Number);
};

const StrikerRoomCore = () => {
  const { query } = useRouter();

  const [roomStatus, setStateRoomStatus] = useState<RoomStatus>("Inactive");
  const [roomState, setStateRoomState] = useState(0);
  const [currentScore, setStateCurrentScore] = useState<[number, number]>([
    0, 0,
  ]);
  const [p1Character, setStateP1Character] = useState(fallbackCharacter);
  const [p2Character, setStateP2Character] = useState(fallbackCharacter);
  const [p1CharacterLocked, setStateP1CharacterLocked] = useState(false);
  const [p2CharacterLocked, setStateP2CharacterLocked] = useState(false);
  const [mostRecentWinner, setStateMostRecentWinner] = useState(-1);
  const [selectedStage, setStateSelectedStage] = useState(0);
  const [currentBans, setStateCurrentBans] = useState<number[]>([]);
  const [firstBan, setStateFirstBan] = useState<number>(0);
  const [configId, setStateConfigId] = useState("");
  const [bestOf, setStateBestOf] = useState(1);

  const {
    data: room,
    isLoading,
    refetch,
  } = api.strikerRoom.getRoomByIdForOverlay.useQuery(
    { id: query.roomId as string },
    {
      enabled: typeof query.roomId === "string",
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          setStateRoomStatus(data.roomStatus);
          setStateRoomState(data.roomState);
          setStateCurrentScore(
            data.currentScore.split(",").map(Number) as [number, number]
          );
          setStateP1Character(
            getConfigById(data.configId).legalCharacters.find(
              (x) => x.name === data.p1SelectedCharacter
            ) ?? fallbackCharacter
          );
          setStateP2Character(
            getConfigById(data.configId).legalCharacters.find(
              (x) => x.name === data.p2SelectedCharacter
            ) ?? fallbackCharacter
          );
          setStateP1CharacterLocked(data.p1CharacterLocked);
          setStateP2CharacterLocked(data.p2CharacterLocked);
          setStateMostRecentWinner(data.mostRecentWinner);
          setStateSelectedStage(data.selectedStage);
          setStateCurrentBans(bansStringToList(data.currentBans));
          setStateFirstBan(data.firstBan);
          setStateConfigId(data.configId);
          setStateBestOf(data.bestOf);
        }
      },
    }
  );

  const [roomConfig, setStateRoomConfig] = useState<roomConfigInterface>({
    id: "",
    name: "",
    description: "",
    gameName: "",
    numberOfBans: 0,
    winnerCharacterLocked: false,
    legalCharacters: [],
    legalStages: [],
    counterpickStages: [],
    bannedStages: [],
  });

  useEffect(() => {
    setStateRoomConfig(getConfigById(configId));
  }, [configId]);

  useSubscribeToEvent("set-p2-id", () => {
    void refetch();
  });

  useSubscribeToEvent("remove-p2-id", () => {
    void refetch();
  });

  useSubscribeToEvent("set-room-status", (data: { roomStatus: RoomStatus }) => {
    setStateRoomStatus(data.roomStatus);
  });

  useSubscribeToEvent(
    "set-character-locked",
    (data: { playerNumber: number; characterLocked: boolean }) => {
      if (data.playerNumber === 1) {
        setStateP1CharacterLocked(data.characterLocked);
      } else {
        setStateP2CharacterLocked(data.characterLocked);
      }
    }
  );

  useSubscribeToEvent(
    "both-characters-locked",
    (data: { roomState: number }) => {
      setStateRoomState(data.roomState);
      setStateP1CharacterLocked(false);
      setStateP2CharacterLocked(false);
    }
  );

  useSubscribeToEvent("set-room-state", (data: { roomState: number }) => {
    setStateRoomState(data.roomState);
  });

  useSubscribeToEvent(
    "set-character",
    (data: {
      character: Character;
      playerNumber: number;
      requester: string;
    }) => {
      if (data.playerNumber === 1) {
        setStateP1Character(
          roomConfig.legalCharacters.find((x) => x.name === data.character) ??
            fallbackCharacter
        );
      } else {
        setStateP2Character(
          roomConfig.legalCharacters.find((x) => x.name === data.character) ??
            fallbackCharacter
        );
      }
    }
  );

  useSubscribeToEvent(
    "set-current-bans",
    (data: { currentBans: string; requester: string }) => {
      setStateCurrentBans(bansStringToList(data.currentBans));
    }
  );

  useSubscribeToEvent(
    "set-selected-stage",
    (data: { selectedStage: number; requester: string }) => {
      setStateSelectedStage(data.selectedStage);
    }
  );

  useSubscribeToEvent(
    "set-current-score",
    (data: { currentScore: string; requester: string }) => {
      setStateCurrentScore(
        data.currentScore.split(",").map(Number) as [number, number]
      );
    }
  );

  useSubscribeToEvent(
    "set-most-recent-winner",
    (data: { mostRecentWinner: number }) => {
      setStateMostRecentWinner(data.mostRecentWinner);
    }
  );

  useSubscribeToEvent(
    "advance-room-state",
    (data: { roomState: number; requester: string }) => {
      setStateRoomState(data.roomState);
    }
  );

  useSubscribeToEvent(
    "set-first-ban",
    (data: { firstBan: number; requester: string }) => {
      setStateFirstBan(data.firstBan);
    }
  );

  useSubscribeToEvent("cancel-room", () => {
    setStateRoomStatus("Canceled");
  });

  useSubscribeToEvent("revert-room", () => {
    void refetch();
  });

  const [currentBanner, setCurrentBanner] = useState(0);
  useEffect(() => {
    if (mostRecentWinner === 1) {
      if (currentBans.length < roomConfig.numberOfBans) {
        setCurrentBanner(1);
      } else {
        setCurrentBanner(2);
      }
    } else if (mostRecentWinner === 2) {
      if (currentBans.length < roomConfig.numberOfBans) {
        setCurrentBanner(2);
      } else {
        setCurrentBanner(1);
      }
    } else {
      if (
        (((currentBans.length - 1) % 4) + 4) % 4 === 0 ||
        (((currentBans.length - 2) % 4) + 4) % 4 === 0
      ) {
        setCurrentBanner(firstBan === 1 ? 2 : 1);
      } else {
        setCurrentBanner(firstBan === 1 ? 1 : 2);
      }
    }
  }, [currentBans, firstBan, mostRecentWinner, roomConfig.numberOfBans]);

  return (
    <>
      {typeof query.roomId !== "string" && <div>Bad ID</div>}

      {typeof query.roomId === "string" && isLoading && <div>Loading...</div>}

      {typeof query.roomId === "string" && !isLoading && !room && (
        <div>Room not found</div>
      )}

      {typeof query.roomId === "string" &&
        !isLoading &&
        room &&
        roomStatus === "Inactive" && (
          <>
            {!room.p2Id && (
              <>
                <div className="flex items-end justify-center space-y-2 pt-4 md:space-y-5">
                  <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
                    {room.p1.name}
                  </div>
                  <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
                    {room.p2?.name ?? "..."}
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center">
                  <div>{roomConfig.name}</div>
                  <div>Best of {bestOf}</div>
                  <div>{roomConfig.numberOfBans} Bans</div>
                  <div>
                    Character Locked:{" "}
                    {roomConfig.winnerCharacterLocked ? "✅" : "❌"}
                  </div>
                  <div>
                    RPS Winner:{" "}
                    {room.firstBan === 0
                      ? "Random"
                      : room.firstBan === 1
                      ? room.p1.name
                      : room.p2?.name}
                  </div>
                  <div className="mt-4">Legal Stages:</div>
                  <div className="grid grid-cols-3 gap-x-4">
                    {roomConfig.legalStages.map((stage, idx) => (
                      <li key={`stage-${idx}`}>{stage.name}</li>
                    ))}
                  </div>
                  {roomConfig.counterpickStages.length > 0 && (
                    <>
                      <div className="mt-4">Counterpick Stages:</div>
                      <div className="grid grid-cols-3 gap-x-4">
                        {roomConfig.counterpickStages.map((stage, idx) => (
                          <li key={`stage-${idx}`}>{stage.name}</li>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {room.p2Id && (
              <>
                <div className="mb-4 flex items-end justify-center space-y-2 pt-4 md:space-y-5">
                  <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
                    {room.p1.name}
                  </div>
                  <img
                    className="flex w-1/12 max-w-xs justify-center"
                    src={p1Character?.image}
                    alt={p1Character?.name}
                  />
                  <div className="md:leading-14 flex w-1/12 justify-center text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
                    vs
                  </div>
                  <img
                    className="flex w-1/12 max-w-xs justify-center"
                    src={p2Character?.image}
                    alt={p2Character?.name}
                  />
                  <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
                    {room.p2?.name}
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center">
                  <h2 className="flex justify-center pb-2 text-lg leading-8 tracking-tight">
                    {roomConfig.name}:
                  </h2>
                  <div>Best of {bestOf}</div>
                  <div>{roomConfig.numberOfBans} Bans</div>
                  <div>
                    Character Locked:{" "}
                    {roomConfig.winnerCharacterLocked ? "✅" : "❌"}
                  </div>
                  <div>
                    First Ban (RPS):{" "}
                    {room.firstBan === 0
                      ? "Random"
                      : room.firstBan === 1
                      ? room.p1.name
                      : room.p2?.name}
                  </div>
                  <h2 className="mt-4 flex justify-center pb-2 text-lg leading-8 tracking-tight">
                    Legal Stages:
                  </h2>
                  <div className="grid grid-cols-3 gap-x-4">
                    {roomConfig.legalStages.map((stage, idx) => (
                      <li key={`stage-${idx}`}>{stage.name}</li>
                    ))}
                  </div>
                  {roomConfig.counterpickStages.length > 0 && (
                    <>
                      <h2 className="mt-4 flex justify-center pb-2 text-lg leading-8 tracking-tight">
                        Counterpick Stages:
                      </h2>
                      <div className="grid grid-cols-3 gap-x-4">
                        {roomConfig.counterpickStages.map((stage, idx) => (
                          <li key={`stage-${idx}`}>{stage.name}</li>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                    Waiting for {room.p1.name} to start
                  </h2>
                </div>
              </>
            )}
          </>
        )}

      {typeof query.roomId === "string" &&
        !isLoading &&
        room &&
        roomStatus !== "Inactive" && (
          <>
            {roomStatus === "Canceled" && <div>Game Canceled</div>}

            {roomStatus === "Complete" && (
              <>
                <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                  Match Complete
                </h2>
                <h2 className="flex justify-center pb-2 text-xl  leading-8 tracking-tight">
                  Report your match result now!
                </h2>
              </>
            )}
            <Scoreboard
              p1Name={room.p1.name}
              p2Name={room.p2?.name}
              p1Character={p1Character}
              p2Character={p2Character}
              currentScore={currentScore}
            />

            {/* Blind character selection */}
            {roomStatus === "Active" && roomState === 1 && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
                    {roomConfig.legalCharacters.map((character, idx) => (
                      <div className="relative" key={`character-${idx}`}>
                        <img src={character.image} alt={character.name} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Stage striking */}
            {roomStatus === "Active" && roomState === 2 && (
              <>
                <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                  {currentBanner === 1 ? room.p1.name : room.p2?.name}: Ban{" "}
                  {currentBans.length % 2 === 0 ||
                  currentBans.length === roomConfig.legalStages.length - 2
                    ? "1 stage"
                    : "2 stages"}
                </h2>
                <div className="grid gap-4">
                  <div className="relative  text-white">
                    <img
                      className="rounded-lg"
                      src={roomConfig.legalStages[selectedStage]?.image}
                      alt={roomConfig.legalStages[selectedStage]?.name}
                    />
                    <div className="absolute bottom-2 left-4 text-lg sm:text-3xl">
                      {roomConfig.legalStages[selectedStage]?.name}
                    </div>
                    <div className="absolute bottom-2 right-4 text-lg sm:text-3xl">
                      Width: {roomConfig.legalStages[selectedStage]?.width}{" "}
                      Height: {roomConfig.legalStages[selectedStage]?.height}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {roomConfig.legalStages.map((stage, idx) => (
                      <div className="relative" key={`stage-${idx}`}>
                        <img
                          className={`rounded-xl border-4 ${
                            selectedStage === idx
                              ? "border-blue-600"
                              : currentBans.includes(idx)
                              ? "border-red-600"
                              : "cursor-pointer border-green-600"
                          }`}
                          src={stage.image}
                          alt={stage.name}
                        />
                        {currentBans.includes(idx) && (
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2 text-4xl  text-red-500 sm:text-lg md:text-2xl lg:text-4xl">
                            BANNED
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Wait for game result - can only report a game loss */}
            {roomStatus === "Active" &&
              roomState >= 3 &&
              roomState % 3 === 0 && (
                <>
                  <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                    Game {currentScore[0] + currentScore[1] + 1} - Report Score
                  </h2>
                  <div className="grid gap-4">
                    <div className="relative  text-white">
                      <img
                        className="rounded-lg"
                        src={
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.image
                        }
                        alt={
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.name
                        }
                      />
                      <div className="absolute bottom-2 left-4 text-lg sm:text-2xl">
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.name
                        }
                      </div>
                      <div className="absolute bottom-2 right-4 text-lg sm:text-2xl">
                        Width:{" "}
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.width
                        }{" "}
                        Height:{" "}
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.height
                        }
                      </div>
                    </div>
                  </div>
                </>
              )}

            {/* W picks character first, L picks character second */}
            {roomStatus === "Active" &&
              roomState > 3 &&
              roomState % 3 === 1 && (
                <>
                  <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                    {mostRecentWinner === 1
                      ? p1CharacterLocked
                        ? room.p2?.name
                        : room.p1.name
                      : p2CharacterLocked
                      ? room.p1.name
                      : room.p2?.name}
                    : Change your character?
                  </h2>
                  <div className="flex flex-col items-center gap-2">
                    <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
                      {roomConfig.legalCharacters.map((character, idx) => (
                        <div className="relative" key={`character-${idx}`}>
                          <img src={character.image} alt={character.name} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            {/* W bans stages, L picks stage */}
            {roomStatus === "Active" &&
              roomState > 3 &&
              roomState % 3 === 2 && (
                <>
                  <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
                    {(mostRecentWinner === 1 &&
                      currentBans.length !== roomConfig.numberOfBans) ||
                    (mostRecentWinner === 2 &&
                      currentBans.length === roomConfig.numberOfBans)
                      ? room.p1.name
                      : room.p2?.name}
                    :{" "}
                    {currentBans.length === roomConfig.numberOfBans
                      ? "Pick"
                      : "Ban"}{" "}
                    {roomConfig.numberOfBans === 1 ||
                    currentBans.length - roomConfig.numberOfBans === 1 ||
                    currentBans.length === roomConfig.numberOfBans
                      ? "1 stage"
                      : `${
                          roomConfig.numberOfBans - currentBans.length
                        } stages`}
                  </h2>
                  <div className="grid gap-4">
                    <div className="relative  text-white">
                      <img
                        className="rounded-lg"
                        src={
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.image
                        }
                        alt={
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.name
                        }
                      />
                      <div className="absolute bottom-2 left-4 text-lg sm:text-2xl">
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.name
                        }
                      </div>
                      <div className="absolute bottom-2 right-4 text-lg sm:text-2xl">
                        Width:{" "}
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.width
                        }{" "}
                        Height:{" "}
                        {
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ][selectedStage]?.height
                        }
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      {[
                        ...roomConfig.legalStages,
                        ...roomConfig.counterpickStages,
                      ].map((stage, idx) => (
                        <div className="relative" key={`stage-${idx}`}>
                          <img
                            className={`rounded-xl border-4 ${
                              selectedStage === idx
                                ? "border-blue-600"
                                : currentBans.includes(idx)
                                ? "border-red-600"
                                : idx > roomConfig.legalStages.length - 1
                                ? "border-yellow-400"
                                : "cursor-pointer border-green-600"
                            }`}
                            src={stage.image}
                            alt={stage.name}
                          />
                          {currentBans.includes(idx) && (
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2 text-4xl  text-red-500 sm:text-lg md:text-2xl lg:text-4xl">
                              BANNED
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </>
        )}
    </>
  );
};

const StrikerRoomView = ({ roomId }: { roomId: string }) => {
  return (
    <PusherProvider slug={`room-${roomId}`}>
      <StrikerRoomCore />
    </PusherProvider>
  );
};

const LazyRoomView = dynamic(() => Promise.resolve(StrikerRoomView), {
  ssr: false,
});

export default function StrikerView() {
  const { query } = useRouter();

  if (!query.roomId || typeof query.roomId !== "string") {
    return null;
  }

  return <LazyRoomView roomId={query.roomId} />;
}
