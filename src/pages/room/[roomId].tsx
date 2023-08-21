/* eslint-disable @next/next/no-img-element */
import { type Character, type RoomStatus } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { CopyToClipboardButton } from "~/components/CopyToClipboardButton";
import { pusherClient } from "~/server/common/pusherClient";
import { usePusherStore } from "~/store/pusherStore";
import { api } from "~/utils/api";
import {
  fallbackCharacter,
  getConfigById,
  type roomConfigInterface,
} from "~/utils/roomConfigs";

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

const Home: NextPage = () => {
  const { data: session } = useSession();

  const { query, events } = useRouter();

  useEffect(() => {
    const exitingFunction = () => {
      pusherClient.unsubscribe(`room-${query.roomId as string}`);
    };

    events.on("routeChangeStart", exitingFunction);

    return () => {
      events.off("routeChangeStart", exitingFunction);
    };
  }, [events, query.roomId]);

  const [disconnected, setStateDisconnected] = useState(false);

  useIdleTimer({
    timeout: 1000 * 60 * 5,
    onIdle: () => {
      pusherClient.unsubscribe(`room-${query.roomId as string}`);
      setStateDisconnected(true);
    },
  });

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
  const [revertRequested, setStateRevertRequested] = useState(0);
  const [configId, setStateConfigId] = useState("");
  const [bestOf, setStateBestOf] = useState(1);
  const [steamUrl, setStateSteamUrl] = useState<string | undefined>(undefined);

  const [confirmResult, setConfirmResult] = useState(false);

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
          setStateRevertRequested(data.revertRequested);
          setStateConfigId(data.configId);
          setStateBestOf(data.bestOf);
          setStateSteamUrl(data.steamUrl ?? undefined);

          if (data.p1Id === session?.user.id) {
            setIAmPlayer(1);
          } else if (data.p2Id === session?.user.id) {
            setIAmPlayer(2);
          }
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

  const pusher = usePusherStore((state) => state.pusherClient);

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
        "set-character-locked",
        (data: { playerNumber: number; characterLocked: boolean }) => {
          if (data.playerNumber === 1) {
            setStateP1CharacterLocked(data.characterLocked);
          } else {
            setStateP2CharacterLocked(data.characterLocked);
          }
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
        (data: {
          character: Character;
          playerNumber: number;
          requester: string;
        }) => {
          if (session?.user.id !== data.requester) {
            if (data.playerNumber === 1) {
              setStateP1Character(
                roomConfig.legalCharacters.find(
                  (x) => x.name === data.character
                ) ?? fallbackCharacter
              );
            } else {
              setStateP2Character(
                roomConfig.legalCharacters.find(
                  (x) => x.name === data.character
                ) ?? fallbackCharacter
              );
            }
          }
        }
      );
      pusher.bind(
        "set-current-bans",
        (data: { currentBans: string; requester: string }) => {
          if (session?.user.id !== data.requester) {
            setStateCurrentBans(bansStringToList(data.currentBans));
          }
        }
      );
      pusher.bind(
        "set-selected-stage",
        (data: { selectedStage: number; requester: string }) => {
          if (session?.user.id !== data.requester) {
            setStateSelectedStage(data.selectedStage);
          }
        }
      );
      pusher.bind(
        "set-current-score",
        (data: { currentScore: string; requester: string }) => {
          if (session?.user.id !== data.requester) {
            setStateCurrentScore(
              data.currentScore.split(",").map(Number) as [number, number]
            );
          }
        }
      );
      pusher.bind(
        "set-most-recent-winner",
        (data: { mostRecentWinner: number }) => {
          setStateMostRecentWinner(data.mostRecentWinner);
        }
      );
      pusher.bind("set-first-ban", (data: { firstBan: number }) => {
        setStateFirstBan(data.firstBan);
      });
      pusher.bind("cancel-room", () => {
        setStateRoomStatus("Canceled");
      });
      pusher.bind(
        "revert-requested",
        (data: { requesterNumber: number; requester: string }) => {
          if (session?.user.id !== data.requester) {
            setStateRevertRequested(data.requesterNumber);
          }
        }
      );
      pusher.bind("revert-room", () => {
        void refetch();
      });
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

  const advanceRoomState = api.strikerRoom.advanceRoomState.useMutation();
  const handleAdvanceRoomState = (roomState: number) => {
    if (session) {
      setStateRoomState(roomState);
      advanceRoomState.mutate({
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
          roomConfig.legalCharacters.find((x) => x.name === character) ??
            fallbackCharacter
        );
      } else {
        setStateP2Character(
          roomConfig.legalCharacters.find((x) => x.name === character) ??
            fallbackCharacter
        );
      }
      setCharacter.mutate({
        id: query.roomId as string,
        playerNumber,
        character,
        requesterNumber: playerNumber,
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
  const handleSetMostRecentWinner = (
    mostRecentWinner: number,
    stageName: string
  ) => {
    if (session) {
      setStateMostRecentWinner(mostRecentWinner);
      setMostRecentWinner.mutate({
        id: query.roomId as string,
        mostRecentWinner,
        stageName,
      });
    }
  };

  const setRevert = api.strikerRoom.revertToLastSafeState.useMutation();
  const handleSetRevert = (requesterNumber: number) => {
    if (session) {
      setStateRevertRequested(iAmPlayer ?? 0);
      setRevert.mutate({
        id: query.roomId as string,
        requesterNumber,
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
        setCurrentBanner(firstBan === 1 ? 2 : 1);
      } else {
        setCurrentBanner(firstBan === 1 ? 1 : 2);
      }
    }
  }, [currentBans, firstBan, mostRecentWinner, roomConfig.numberOfBans]);

  if (typeof query.roomId !== "string") return <p>Bad ID</p>;

  if (!session) {
    return <p>Not authorised. Please sign in to view this page.</p>;
  }

  if (isLoading) return <div>Loading...</div>;

  if (!room) return <div>Room not found</div>;

  if (disconnected) return <div>Disconnected due to inactivity</div>;

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

          <div className="mt-8 flex flex-col items-center">
            <div>{roomConfig.name}</div>
            <div>Best of {bestOf}</div>
            <div>{roomConfig.numberOfBans} Bans</div>
            <div>
              Character Locked: {roomConfig.winnerCharacterLocked ? "✅" : "❌"}
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

          <div className="mt-4 flex justify-center">
            {room.p1Id === session?.user.id && <CopyToClipboardButton />}
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
             py-2 text-4xl text-white hover:bg-green-700"
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

        <div className="mt-8 flex flex-col items-center">
          <h2 className="flex justify-center pb-2 text-lg leading-8 tracking-tight">
            {roomConfig.name}:
          </h2>
          <div>Best of {bestOf}</div>
          <div>{roomConfig.numberOfBans} Bans</div>
          <div>
            Character Locked: {roomConfig.winnerCharacterLocked ? "✅" : "❌"}
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
          {iAmPlayer === 1 ? (
            <button
              className="rounded bg-green-500 px-4
             py-2 text-4xl  text-white hover:bg-green-700"
              onClick={() => {
                handleAdvanceRoomState(roomState + 1);
                handleSetRoomStatus("Active");
              }}
            >
              Start
            </button>
          ) : (
            <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
              Waiting for {room.p1.name} to start
            </h2>
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
          <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
            Match Complete
          </h2>
          <h2 className="flex justify-center pb-2 text-xl  leading-8 tracking-tight">
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

      {/* Blind character selection */}
      {roomStatus === "Active" && roomState === 1 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
            {iAmPlayer === 1 ? room.p1.name : room.p2?.name}: Pick your
            character
          </h2>
          <div className="flex flex-col items-center gap-2">
            {iAmPlayer && (
              <button
                onClick={() => {
                  if (iAmPlayer === 1) {
                    if (!p1CharacterLocked) {
                      handleSetCharacterLocked(1, true);
                    }
                  } else if (iAmPlayer === 2) {
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
                } px-4 py-2 text-2xl text-white`}
              >
                {iAmPlayer === 1
                  ? p1CharacterLocked
                    ? "LOCKED"
                    : "LOCK IN"
                  : p2CharacterLocked
                  ? "LOCKED"
                  : "LOCK IN"}
              </button>
            )}
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
                    } else if (iAmPlayer === 2) {
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
                  <img
                    className={`rounded-lg bg-white ${
                      (iAmPlayer === 1 && !p1CharacterLocked) ||
                      (iAmPlayer === 2 && !p2CharacterLocked)
                        ? "hover:bg-slate-200"
                        : ""
                    }`}
                    src={character.image}
                    alt={character.name}
                  />
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
                      handleAdvanceRoomState(roomState + 1);
                      handleSetSelectedStage(
                        firstMissingNumber(
                          newBans,
                          roomConfig.legalStages.length
                        )
                      );
                      handleSetCurrentBans("");
                    }
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-red-500 px-4 py-2 text-4xl  text-white hover:bg-red-700"
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
      {roomStatus === "Active" && roomState >= 3 && roomState % 3 === 0 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
            Game {currentScore[0] + currentScore[1] + 1} - Report Score
          </h2>
          {steamUrl && iAmPlayer && (
            <div className="flex justify-center pb-2 text-xl  leading-8 tracking-tight">
              <Link href={steamUrl}>Join Game Room: {steamUrl}</Link>
            </div>
          )}
          <div className="grid gap-4">
            {iAmPlayer && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={!iAmPlayer || iAmPlayer === 1}
                  onClick={() => {
                    if (!confirmResult) {
                      setConfirmResult(true);
                    } else {
                      setConfirmResult(false);
                      handleSetCurrentScore([
                        currentScore[0] + 1,
                        currentScore[1],
                      ]);
                      handleSetMostRecentWinner(
                        1,
                        [
                          ...roomConfig.legalStages,
                          ...roomConfig.counterpickStages,
                        ][selectedStage]?.name ?? ""
                      );
                      if (currentScore[0] === Math.floor(bestOf / 2)) {
                        handleSetRoomStatus("Complete");
                      } else {
                        if (roomConfig.winnerCharacterLocked) {
                          handleSetCharacterLocked(1, true);
                        }
                        handleAdvanceRoomState(roomState + 1);
                      }
                    }
                  }}
                  className={`rounded ${
                    iAmPlayer === 1
                      ? "bg-slate-500"
                      : "bg-green-500 hover:bg-green-700"
                  } px-4 py-2 text-4xl  text-white`}
                >
                  {confirmResult && iAmPlayer === 2 ? `Confirm?` : room.p1.name}
                </button>
                <button
                  disabled={!iAmPlayer || iAmPlayer === 2}
                  onClick={() => {
                    if (!confirmResult) {
                      setConfirmResult(true);
                    } else {
                      setConfirmResult(false);
                      handleSetCurrentScore([
                        currentScore[0],
                        currentScore[1] + 1,
                      ]);
                      handleSetMostRecentWinner(
                        2,
                        [
                          ...roomConfig.legalStages,
                          ...roomConfig.counterpickStages,
                        ][selectedStage]?.name ?? ""
                      );
                      if (currentScore[1] === Math.floor(bestOf / 2)) {
                        handleSetRoomStatus("Complete");
                      } else {
                        if (roomConfig.winnerCharacterLocked) {
                          handleSetCharacterLocked(2, true);
                        }
                        handleAdvanceRoomState(roomState + 1);
                      }
                    }
                  }}
                  className={`rounded ${
                    iAmPlayer === 2
                      ? "bg-slate-500"
                      : "bg-green-500 hover:bg-green-700"
                  } px-4 py-2 text-4xl  text-white`}
                >
                  {confirmResult && iAmPlayer === 1
                    ? `Confirm?`
                    : room.p2?.name}
                </button>
              </div>
            )}
            <div className="relative  text-white">
              <img
                className="rounded-lg"
                src={
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.image
                }
                alt={
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.name
                }
              />
              <div className="absolute bottom-2 left-4 text-lg sm:text-2xl">
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.name
                }
              </div>
              <div className="absolute bottom-2 right-4 text-lg sm:text-2xl">
                Width:{" "}
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.width
                }{" "}
                Height:{" "}
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.height
                }
              </div>
            </div>
          </div>
        </>
      )}

      {/* W picks character first, L picks character second */}
      {roomStatus === "Active" && roomState > 3 && roomState % 3 === 1 && (
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
            {iAmPlayer && (
              <button
                onClick={() => {
                  if (iAmPlayer === 1) {
                    if (!p1CharacterLocked) {
                      handleSetCharacterLocked(1, true);
                    }
                  } else if (iAmPlayer === 2) {
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
                } px-4 py-2 text-2xl  text-white`}
              >
                {iAmPlayer === 1
                  ? p1CharacterLocked
                    ? "LOCKED"
                    : "LOCK IN"
                  : p2CharacterLocked
                  ? "LOCKED"
                  : "LOCK IN"}
              </button>
            )}
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
              {roomConfig.legalCharacters.map((character, idx) => (
                <div
                  onClick={() => {
                    if (iAmPlayer === 1) {
                      if (
                        (!p1CharacterLocked && mostRecentWinner === 1) ||
                        (p2CharacterLocked && mostRecentWinner === 2)
                      ) {
                        handleSetCharacter(1, character.name as Character);
                      }
                    } else if (iAmPlayer === 2) {
                      if (
                        (!p2CharacterLocked && mostRecentWinner === 2) ||
                        (p1CharacterLocked && mostRecentWinner === 1)
                      ) {
                        handleSetCharacter(2, character.name as Character);
                      }
                    }
                  }}
                  className="relative"
                  key={`character-${idx}`}
                >
                  <img
                    className={`rounded-lg bg-white ${
                      (iAmPlayer === 1 &&
                        ((!p1CharacterLocked && mostRecentWinner === 1) ||
                          (p2CharacterLocked && mostRecentWinner === 2))) ||
                      (iAmPlayer === 2 &&
                        ((!p2CharacterLocked && mostRecentWinner === 2) ||
                          (p1CharacterLocked && mostRecentWinner === 1)))
                        ? "hover:bg-slate-200"
                        : ""
                    }`}
                    src={character.image}
                    alt={character.name}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* W bans stages, L picks stage */}
      {roomStatus === "Active" && roomState > 3 && roomState % 3 === 2 && (
        <>
          <h2 className="flex justify-center pb-2 text-2xl  leading-8 tracking-tight">
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
            <div className="relative  text-white">
              <img
                className="rounded-lg"
                src={
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.image
                }
                alt={
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.name
                }
              />
              <div className="absolute bottom-2 left-4 text-lg sm:text-2xl">
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.name
                }
              </div>
              <div className="absolute bottom-2 right-4 text-lg sm:text-2xl">
                Width:{" "}
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.width
                }{" "}
                Height:{" "}
                {
                  [...roomConfig.legalStages, ...roomConfig.counterpickStages][
                    selectedStage
                  ]?.height
                }
              </div>
              {iAmPlayer === currentBanner && (
                <button
                  onClick={() => {
                    if (currentBans.length === roomConfig.numberOfBans) {
                      handleAdvanceRoomState(roomState + 1);
                      handleSetCurrentBans("");
                    } else {
                      const newBans = [...currentBans, selectedStage];
                      handleSetCurrentBans(newBans.join(","));
                      handleSetSelectedStage(
                        firstMissingNumber(
                          newBans,
                          [
                            ...roomConfig.legalStages,
                            ...roomConfig.counterpickStages,
                          ].length
                        )
                      );
                    }
                  }}
                  className={`text-4xl ${
                    currentBans.length === roomConfig.numberOfBans
                      ? "bg-green-500 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-700"
                  } absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-4 py-2  text-white`}
                >
                  {currentBans.length === roomConfig.numberOfBans
                    ? "PICK"
                    : "BAN"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[...roomConfig.legalStages, ...roomConfig.counterpickStages].map(
                (stage, idx) => (
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
                )
              )}
            </div>
          </div>
        </>
      )}

      {roomStatus === "Active" && roomState > 3 && (
        <div className="flex justify-center pt-8">
          <button
            disabled={!iAmPlayer}
            onClick={() => {
              if (iAmPlayer) {
                handleSetRevert(iAmPlayer);
              }
            }}
            className={`rounded ${
              revertRequested === iAmPlayer ? "bg-red-500" : "bg-green-500"
            }
             px-4 py-2 text-lg text-white ${
               revertRequested === iAmPlayer ? "" : "hover:bg-green-700"
             }`}
          >
            {!revertRequested
              ? "Request undo"
              : revertRequested !== iAmPlayer
              ? `Undo requested${
                  revertRequested === 1
                    ? ` by ${room.p1.name}`
                    : revertRequested === 2
                    ? ` by ${room.p2?.name}`
                    : ""
                }`
              : "Undo requested"}
          </button>
        </div>
      )}
    </>
  );
};

export default Home;
