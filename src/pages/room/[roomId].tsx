/* eslint-disable @next/next/no-img-element */
import { type Character, type RoomStatus } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { pusherClient } from "~/server/common/pusherClient";
import { api } from "~/utils/api";

const firstMissingNumber = (current: number[], length: number): number => {
  const currentSorted = current.sort();
  for (let i = 0; i < length; i++) {
    if (currentSorted[i] != i) return i;
  }
  return -1;
};

const bansStringToList = (bans: string): number[] => {
  if (bans === "") return [];
  return bans.split(",").map(Number);
};

const roomConfig = {
  gameName: "Lethal League Blaze",
  bestOf: 3,
  numberOfBans: 2,
  winnerCharacterLocked: true,
  legalCharacters: [
    { name: "Candyman", image: "https://i.imgur.com/fiIa0Wp.png" },
    { name: "Dice", image: "https://i.imgur.com/hVHrBkE.png" },
    { name: "Doombox", image: "https://i.imgur.com/JI4k9Wo.png" },
    { name: "Dust", image: "https://i.imgur.com/aabjDwX.png" },
    { name: "Grid", image: "https://i.imgur.com/eAmPWSU.png" },
    { name: "Jet", image: "https://i.imgur.com/9wRfyzA.png" },
    { name: "Latch", image: "https://i.imgur.com/3UbnjBP.png" },
    { name: "Nitro", image: "https://i.imgur.com/ZGD5PqH.png" },
    { name: "Raptor", image: "https://i.imgur.com/XfzhISG.png" },
    { name: "Sonata", image: "https://i.imgur.com/o6WcxWD.png" },
    { name: "Switch", image: "https://i.imgur.com/o9r8z6j.png" },
    { name: "Toxic", image: "https://i.imgur.com/s9xaYCu.png" },
    { name: "All", image: "https://i.imgur.com/mgwDy0f.png", default: true },
  ],
  legalStages: [
    {
      name: "Subway",
      image: "https://i.imgur.com/TQliTA8.png",
      width: "1050",
      height: "510",
    },
    {
      name: "Desert",
      image: "https://i.imgur.com/RxkSs5N.png",
      width: "1130",
      height: "510",
    },
    {
      name: "Room",
      image: "https://i.imgur.com/TB6KlRK.png",
      width: "1100",
      height: "550",
    },
    {
      name: "Outskirts",
      image: "https://i.imgur.com/R5b6ZNq.png",
      width: "1240",
      height: "510",
    },
    {
      name: "Streets",
      image: "https://i.imgur.com/gSxcB5k.png",
      width: "1320",
      height: "515",
    },
  ],
  counterpickStages: [
    {
      name: "Elevator",
      image: "https://i.imgur.com/nRFtIK9.png",
      width: "1492",
      height: "522",
    },
    {
      name: "Pool",
      image: "https://i.imgur.com/8xhB7na.png",
      width: "1210",
      height: "575",
    },
  ],
  bannedStages: [
    {
      name: "Sewer",
      image: "https://i.imgur.com/gf0oKf8.png",
      width: "1240",
      height: "510",
    },
  ],
};

const Home: NextPage = () => {
  const { data: session } = useSession();

  const { query } = useRouter();

  const defaultCharacter = roomConfig.legalCharacters.find(
    (x) => x.default === true
  );

  const [p1Id, setStateP1Id] = useState<string | null>(null);
  const [p2Id, setStateP2Id] = useState<string | null>(null);
  const [roomStatus, setStateRoomStatus] = useState<RoomStatus>("Inactive");
  const [roomState, setStateRoomState] = useState(0);
  const [currentScore, setStateCurrentScore] = useState<[number, number]>([
    0, 0,
  ]);
  const [p1Character, setStateP1Character] = useState(defaultCharacter);
  const [p2Character, setStateP2Character] = useState(defaultCharacter);
  const [p1CharacterLocked, setStateP1CharacterLocked] = useState(false);
  const [p2CharacterLocked, setStateP2CharacterLocked] = useState(false);
  const [mostRecentWinner, setStateMostRecentWinner] = useState(-1);
  const [selectedStage, setStateSelectedStage] = useState(0);
  const [currentBans, setStateCurrentBans] = useState<number[]>([]);

  const [iAmPlayer, setIAmPlayer] = useState<number | null>(null);

  const {
    data: room,
    isLoading,
    refetch,
  } = api.strikerRoom.getRoomById.useQuery(
    { id: query.roomId as string },
    {
      enabled: typeof query.roomId === "string",
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          setStateP1Id(data.p1Id);
          setStateP2Id(data.p2Id);
          setStateRoomStatus(data.roomStatus);
          setStateRoomState(data.roomState);
          setStateCurrentScore(
            data.currentScore.split(",").map(Number) as [number, number]
          );
          setStateP1Character(
            roomConfig.legalCharacters.find(
              (x) => x.name === data.p1SelectedCharacter
            ) ?? defaultCharacter
          );
          setStateP2Character(
            roomConfig.legalCharacters.find(
              (x) => x.name === data.p2SelectedCharacter
            ) ?? defaultCharacter
          );
          setStateP1CharacterLocked(data.p1CharacterLocked);
          setStateP2CharacterLocked(data.p2CharacterLocked);
          setStateMostRecentWinner(data.mostRecentWinner);
          setStateSelectedStage(data.selectedStage);
          setStateCurrentBans(bansStringToList(data.currentBans));

          if (data.p1Id === session?.user.id) {
            setIAmPlayer(1);
          } else if (data.p2Id === session?.user.id) {
            setIAmPlayer(2);
          }
        }
      },
    }
  );

  const pusher = pusherClient;

  useEffect(() => {
    if (typeof room?.id === "string") {
      pusher.subscribe(`room-${room.id}`);
      pusher.bind("set-p2-id", async () => {
        await refetch();
      });
      pusher.bind("set-room-status", (data: { roomStatus: RoomStatus }) => {
        setStateRoomStatus(data.roomStatus);
      });
      pusher.bind(
        "set-p1-character-locked",
        (data: { p1CharacterLocked: boolean }) => {
          setStateP1CharacterLocked(data.p1CharacterLocked);
        }
      );
      pusher.bind(
        "set-p2-character-locked",
        (data: { p2CharacterLocked: boolean }) => {
          setStateP2CharacterLocked(data.p2CharacterLocked);
        }
      );
      pusher.bind("both-characters-locked", (data: { roomState: number }) => {
        // console.log("syncing characters");
        // if (iAmPlayer === 1) {
        //   handleSetCharacter(1, p1Character?.name as Character);
        // } else {
        //   handleSetCharacter(2, p2Character?.name as Character);
        // }
        setStateRoomState(data.roomState);
        setStateP1CharacterLocked(false);
        setStateP2CharacterLocked(false);
      });
      pusher.bind("set-room-state", (data: { roomState: number }) => {
        setStateRoomState(data.roomState);
      });
      pusher.bind(
        "set-character",
        (data: { character: Character; playerNumber: number }) => {
          if (data.playerNumber === 1) {
            setStateP1Character(
              roomConfig.legalCharacters.find((x) => x.name === data.character)
            );
          } else {
            setStateP2Character(
              roomConfig.legalCharacters.find((x) => x.name === data.character)
            );
          }
        }
      );
      pusher.bind("set-current-bans", (data: { currentBans: string }) => {
        setStateCurrentBans(bansStringToList(data.currentBans));
      });
      pusher.bind("set-selected-stage", (data: { selectedStage: number }) => {
        setStateSelectedStage(data.selectedStage);
      });
      pusher.bind("set-current-score", (data: { currentScore: string }) => {
        setStateCurrentScore(
          data.currentScore.split(",").map(Number) as [number, number]
        );
      });
      pusher.bind(
        "set-most-recent-winner",
        (data: { mostRecentWinner: number }) => {
          setStateMostRecentWinner(data.mostRecentWinner);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  const setP2Id = api.strikerRoom.setP2Id.useMutation();
  const handleSetP2Id = () => {
    if (session) {
      setP2Id.mutate({ id: query.roomId as string, p2Id: session.user.id });
    }
  };

  const setRoomStatus = api.strikerRoom.setRoomStatus.useMutation();
  const handleSetRoomStatus = (roomStatus: RoomStatus) => {
    if (session) {
      setStateRoomStatus(roomStatus);
      setRoomStatus.mutate({
        id: query.roomId as string,
        roomStatus,
      });
    }
  };

  const setCharacterLocked = api.strikerRoom.setCharacterLocked.useMutation();
  const handleSetCharacterLocked = (
    playerNumber: number,
    characterLocked: boolean
  ) => {
    if (session) {
      if (playerNumber === 1) {
        setStateP1CharacterLocked(characterLocked);
      } else {
        setStateP2CharacterLocked(characterLocked);
      }
      setCharacterLocked.mutate({
        id: query.roomId as string,
        characterLocked,
        playerNumber,
      });
    }
  };

  const setRoomState = api.strikerRoom.setRoomState.useMutation();
  const handleSetRoomState = (roomState: number) => {
    if (session) {
      setStateRoomState(roomState);
      setRoomState.mutate({
        id: query.roomId as string,
        roomState,
      });
    }
  };

  const setCharacter = api.strikerRoom.setCharacter.useMutation();
  const handleSetCharacter = (playerNumber: number, character: Character) => {
    if (session) {
      if (playerNumber === 1) {
        setStateP1Character(
          roomConfig.legalCharacters.find((x) => x.name === character)
        );
      } else {
        setStateP2Character(
          roomConfig.legalCharacters.find((x) => x.name === character)
        );
      }
      setCharacter.mutate({
        id: query.roomId as string,
        playerNumber,
        character,
      });
    }
  };

  const setCurrentBans = api.strikerRoom.setCurrentBans.useMutation();
  const handleSetCurrentBans = (currentBans: string) => {
    if (session) {
      setStateCurrentBans(bansStringToList(currentBans));
      setCurrentBans.mutate({
        id: query.roomId as string,
        currentBans,
      });
    }
  };

  const setSelectedStage = api.strikerRoom.setSelectedStage.useMutation();
  const handleSetSelectedStage = (selectedStage: number) => {
    if (session) {
      setStateSelectedStage(selectedStage);
      setSelectedStage.mutate({
        id: query.roomId as string,
        selectedStage,
      });
    }
  };

  const setCurrentScore = api.strikerRoom.setCurrentScore.useMutation();
  const handleSetCurrentScore = (currentScore: [number, number]) => {
    if (session) {
      setStateCurrentScore(currentScore);
      setCurrentScore.mutate({
        id: query.roomId as string,
        currentScore: currentScore.join(","),
      });
    }
  };

  const setMostRecentWinner = api.strikerRoom.setMostRecentWinner.useMutation();
  const handleSetMostRecentWinner = (mostRecentWinner: number) => {
    if (session) {
      setStateMostRecentWinner(mostRecentWinner);
      setMostRecentWinner.mutate({
        id: query.roomId as string,
        mostRecentWinner,
      });
    }
  };

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
        setCurrentBanner(1);
      } else {
        setCurrentBanner(2);
      }
    }
  }, [currentBans, mostRecentWinner]);

  if (typeof query.roomId !== "string") return <p>Bad ID</p>;

  if (!session) {
    return <p>Not authorised</p>;
  }

  if (isLoading) return <div>Loading...</div>;

  if (!room) return <div>Room not found</div>;

  // WAITING ROOM

  if (roomStatus === "Inactive") {
    if (room.p1Id === session?.user.id && !room.p2Id) {
      return (
        <>
          <div className="flex items-end justify-center space-y-2 pt-4 md:space-y-5">
            <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
              {room.p1.name}
            </div>
            <div className="md:leading-14 flex w-auto flex-1 justify-center break-all text-2xl font-extrabold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
              {room.p2?.name ?? "..."}
            </div>
          </div>
        </>
      );
    }

    if (!room.p2Id) {
      return (
        <div className="flex justify-center">
          <button
            onClick={() => handleSetP2Id()}
            className="rounded bg-green-500 px-4
             py-2 text-4xl font-bold text-white hover:bg-green-700"
          >
            Join {room.p1.name}&apos;s room?
          </button>
        </div>
      );
    }

    return (
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

        <div className="flex justify-center">
          {room.p1Id === session?.user.id ? (
            <button
              className="rounded bg-green-500 px-4
             py-2 text-4xl font-bold text-white hover:bg-green-700"
              onClick={() => {
                handleSetRoomState(1); // remove this when state 0 is implemented
                handleSetRoomStatus("Active");
              }}
            >
              Start?
            </button>
          ) : (
            <div>Waiting for {room.p1.name} to start</div>
          )}
        </div>
      </>
    );
  }

  // GAME CANCELLED

  if (roomStatus === "Canceled") {
    return <div>Game canceled</div>;
  }

  // GAME IN PROGRESS

  return (
    <>
      {roomStatus === "Complete" && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            Match Complete
          </h2>
          <h2 className="flex justify-center pb-2 text-xl font-bold leading-8 tracking-tight">
            Report your match result now!
          </h2>
        </>
      )}
      <div className="flex items-end justify-center space-y-2 pt-4 md:space-y-5">
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
      <div className="flex items-end justify-center gap-4 space-y-2 pb-6 md:space-y-5">
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {currentScore[0]}
        </h1>
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          -
        </h1>
        <h1 className="md:leading-14 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-10 md:text-5xl">
          {currentScore[1]}
        </h1>
      </div>

      {/* Ask user who will be going first - us, them, or random
          Confirm correct settings config */}
      {roomState === 0 && <div></div>}

      {/* Blind character selection */}
      {roomState === 1 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            {iAmPlayer === 1 ? room.p1.name : room.p2?.name}: Pick your
            character
          </h2>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (iAmPlayer === 1) {
                  if (!p1CharacterLocked) {
                    handleSetCharacterLocked(1, true);
                  }
                } else {
                  if (!p2CharacterLocked) {
                    handleSetCharacterLocked(2, true);
                  }
                }
              }}
              className={`rounded ${
                iAmPlayer === 1
                  ? p1CharacterLocked
                    ? "bg-red-500"
                    : "bg-green-500"
                  : p2CharacterLocked
                  ? "bg-red-500"
                  : "bg-green-500"
              } px-4 py-2 text-2xl font-bold text-white`}
            >
              {iAmPlayer === 1
                ? p1CharacterLocked
                  ? "LOCKED"
                  : "LOCK IN"
                : p2CharacterLocked
                ? "LOCKED"
                : "LOCK IN"}
            </button>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
              {roomConfig.legalCharacters.map((character, idx) => (
                <div
                  onClick={() => {
                    if (iAmPlayer === 1) {
                      if (!p1CharacterLocked) {
                        // setStateP1Character(
                        //   roomConfig.legalCharacters.find(
                        //     (c) => c.name === character.name
                        //   )
                        // );
                        handleSetCharacter(1, character.name as Character);
                      }
                    } else {
                      if (!p2CharacterLocked) {
                        // setStateP2Character(
                        //   roomConfig.legalCharacters.find(
                        //     (c) => c.name === character.name
                        //   )
                        // );
                        handleSetCharacter(2, character.name as Character);
                      }
                    }
                  }}
                  className="relative"
                  key={`character-${idx}`}
                >
                  <img src={character.image} alt={character.name} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Stage striking */}
      {roomState === 2 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            {currentBanner === 1 ? room.p1.name : room.p2?.name}: Ban{" "}
            {currentBans.length % 2 === 0 ||
            currentBans.length === roomConfig.legalStages.length - 2
              ? "1 stage"
              : "2 stages"}
          </h2>
          <div className="grid gap-4">
            <div className="relative font-bold text-white">
              <img
                className="rounded-lg"
                src={roomConfig.legalStages[selectedStage]?.image}
                alt={roomConfig.legalStages[selectedStage]?.name}
              />
              <div className="absolute bottom-2 left-4 text-lg sm:text-3xl">
                {roomConfig.legalStages[selectedStage]?.name}
              </div>
              <div className="absolute bottom-2 right-4 text-lg sm:text-3xl">
                Width: {roomConfig.legalStages[selectedStage]?.width} Height:{" "}
                {roomConfig.legalStages[selectedStage]?.height}
              </div>
              {iAmPlayer === currentBanner && (
                <button
                  onClick={() => {
                    const newBans = [...currentBans, selectedStage];
                    handleSetCurrentBans(newBans.join(","));
                    handleSetSelectedStage(
                      firstMissingNumber(newBans, roomConfig.legalStages.length)
                    );
                    if (newBans.length === roomConfig.legalStages.length - 1) {
                      handleSetRoomState(roomState + 1);
                      handleSetSelectedStage(
                        firstMissingNumber(
                          newBans,
                          roomConfig.legalStages.length
                        )
                      );
                      handleSetCurrentBans("");
                    }
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-red-500 px-4 py-2 text-4xl font-bold text-white hover:bg-red-700"
                >
                  BAN
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {roomConfig.legalStages.map((stage, idx) => (
                <div
                  onClick={() => {
                    if (
                      iAmPlayer === currentBanner &&
                      !currentBans.includes(idx)
                    ) {
                      handleSetSelectedStage(idx);
                    }
                  }}
                  className="relative"
                  key={`stage-${idx}`}
                >
                  <img
                    className={`rounded-xl border-4 ${
                      selectedStage === idx || currentBans.includes(idx)
                        ? "border-red-600"
                        : "cursor-pointer border-green-600"
                    }`}
                    src={stage.image}
                    alt={stage.name}
                  />
                  {currentBans.includes(idx) && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2 text-4xl font-bold text-red-500 sm:text-lg md:text-2xl lg:text-4xl">
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
      {roomState === 3 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            Game {currentScore[0] + currentScore[1] + 1} - Report Score
          </h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={iAmPlayer === 1}
                onClick={() => {
                  handleSetCurrentScore([currentScore[0] + 1, currentScore[1]]);
                  handleSetMostRecentWinner(1);
                  if (currentScore[0] === Math.floor(roomConfig.bestOf / 2)) {
                    handleSetRoomState(6);
                    handleSetRoomStatus("Complete");
                  } else {
                    if (roomConfig.winnerCharacterLocked) {
                      handleSetCharacterLocked(1, true);
                    }
                    handleSetRoomState(roomState + 1);
                  }
                }}
                className={`rounded ${
                  iAmPlayer === 1
                    ? "bg-slate-500"
                    : "bg-green-500 hover:bg-green-700"
                } px-4 py-2 text-4xl font-bold text-white`}
              >
                {room.p1.name}
              </button>
              <button
                disabled={iAmPlayer === 2}
                onClick={() => {
                  handleSetCurrentScore([currentScore[0], currentScore[1] + 1]);
                  handleSetMostRecentWinner(2);
                  if (currentScore[1] === Math.floor(roomConfig.bestOf / 2)) {
                    handleSetRoomState(6);
                    handleSetRoomStatus("Complete");
                  } else {
                    if (roomConfig.winnerCharacterLocked) {
                      handleSetCharacterLocked(2, true);
                    }
                    handleSetRoomState(roomState + 1);
                  }
                }}
                className={`rounded ${
                  iAmPlayer === 2
                    ? "bg-slate-500"
                    : "bg-green-500 hover:bg-green-700"
                } px-4 py-2 text-4xl font-bold text-white`}
              >
                {room.p2?.name}
              </button>
            </div>
            <div className="relative font-bold text-white">
              {/* set the correct stage being played! */}
              <img
                className="rounded-lg"
                src={roomConfig.legalStages[selectedStage]?.image}
                alt={roomConfig.legalStages[selectedStage]?.name}
              />
              <div className="absolute bottom-2 left-4 text-lg sm:text-3xl">
                {roomConfig.legalStages[selectedStage]?.name}
              </div>
              <div className="absolute bottom-2 right-4 text-lg sm:text-3xl">
                Width: {roomConfig.legalStages[selectedStage]?.width} Height:{" "}
                {roomConfig.legalStages[selectedStage]?.height}
              </div>
            </div>
          </div>
        </>
      )}

      {/* W picks character first, L picks character second */}
      {roomState === 4 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
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
            <button
              onClick={() => {
                if (iAmPlayer === 1) {
                  if (!p1CharacterLocked) {
                    handleSetCharacterLocked(1, true);
                  }
                } else {
                  if (!p2CharacterLocked) {
                    handleSetCharacterLocked(2, true);
                  }
                }
              }}
              className={`rounded ${
                iAmPlayer === 1
                  ? p1CharacterLocked
                    ? "bg-red-500"
                    : "bg-green-500"
                  : p2CharacterLocked
                  ? "bg-red-500"
                  : "bg-green-500"
              } px-4 py-2 text-2xl font-bold text-white`}
            >
              {iAmPlayer === 1
                ? p1CharacterLocked
                  ? "LOCKED"
                  : "LOCK IN"
                : p2CharacterLocked
                ? "LOCKED"
                : "LOCK IN"}
            </button>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
              {roomConfig.legalCharacters.map((character, idx) => (
                <div
                  onClick={() => {
                    if (iAmPlayer === 1) {
                      if (!p1CharacterLocked) {
                        handleSetCharacter(1, character.name as Character);
                      }
                    } else {
                      if (!p2CharacterLocked) {
                        handleSetCharacter(2, character.name as Character);
                      }
                    }
                    // if (
                    //   (mostRecentWinner === 1 && !p1CharacterLocked) ||
                    //   (mostRecentWinner === 2 && !p2CharacterLocked)
                    // ) {
                    //   if (iAmPlayer === 1) {
                    //     handleSetCharacter(1, character.name as Character);
                    //   }
                    // } else {
                    //   if (iAmPlayer === 2) {
                    //     handleSetCharacter(2, character.name as Character);
                    //   }
                    // }
                  }}
                  className="relative"
                  key={`character-${idx}`}
                >
                  <img src={character.image} alt={character.name} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* W bans stages, L picks stage */}
      {roomState === 5 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl font-bold leading-8 tracking-tight">
            {(mostRecentWinner === 1 &&
              currentBans.length !== roomConfig.numberOfBans) ||
            (mostRecentWinner === 2 &&
              currentBans.length === roomConfig.numberOfBans)
              ? room.p1.name
              : room.p2?.name}
            : {currentBans.length === roomConfig.numberOfBans ? "Pick" : "Ban"}{" "}
            {roomConfig.numberOfBans === 1 ||
            currentBans.length - roomConfig.numberOfBans === 1 ||
            currentBans.length === roomConfig.numberOfBans
              ? "1 stage"
              : `${roomConfig.numberOfBans - currentBans.length} stages`}
          </h2>
          <div className="grid gap-4">
            <div className="relative font-bold text-white">
              <img
                className="rounded-lg"
                src={roomConfig.legalStages[selectedStage]?.image}
                alt={roomConfig.legalStages[selectedStage]?.name}
              />
              <div className="absolute bottom-2 left-4 text-lg sm:text-3xl">
                {roomConfig.legalStages[selectedStage]?.name}
              </div>
              <div className="absolute bottom-2 right-4 text-lg sm:text-3xl">
                Width: {roomConfig.legalStages[selectedStage]?.width} Height:{" "}
                {roomConfig.legalStages[selectedStage]?.height}
              </div>
              {iAmPlayer === currentBanner && (
                <button
                  onClick={() => {
                    if (currentBans.length === roomConfig.numberOfBans) {
                      handleSetRoomState(roomState - 2);
                      handleSetCurrentBans("");
                    } else {
                      const newBans = [...currentBans, selectedStage];
                      handleSetCurrentBans(newBans.join(","));
                      handleSetSelectedStage(
                        firstMissingNumber(
                          newBans,
                          roomConfig.legalStages.length
                        )
                      );
                    }
                  }}
                  className={`text-4xl ${
                    currentBans.length === roomConfig.numberOfBans
                      ? "bg-green-500 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-700"
                  } absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2 font-bold text-white`}
                >
                  {currentBans.length === roomConfig.numberOfBans
                    ? "PICK"
                    : "BAN"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {roomConfig.legalStages.map((stage, idx) => (
                <div
                  onClick={() => {
                    if (!currentBans.includes(idx)) {
                      handleSetSelectedStage(idx);
                    }
                  }}
                  className="relative"
                  key={`stage-${idx}`}
                >
                  <img
                    className={`rounded-xl border-4 ${
                      selectedStage === idx || currentBans.includes(idx)
                        ? "border-red-600"
                        : "cursor-pointer border-green-600"
                    }`}
                    src={stage.image}
                    alt={stage.name}
                  />
                  {currentBans.includes(idx) && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2 text-4xl font-bold text-red-500 sm:text-lg md:text-2xl lg:text-4xl">
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
  );
};

export default Home;
