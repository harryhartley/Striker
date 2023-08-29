import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { BeatLoader } from "react-spinners";
import { api } from "~/utils/api";
import { getConfigNamesByGame } from "~/utils/roomConfigs";

interface Inputs {
  configId: string;
  bestOf: number;
}

const Home: NextPage = () => {
  const { data: session } = useSession();
  const { push } = useRouter();

  const {
    data: rooms,
    isLoading: loadingRooms,
    refetch,
  } = api.strikerRoom.getIncompleteRoomsByUserId.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  const createStrikerRoom = api.strikerRoom.createRoom.useMutation({
    async onSuccess(data) {
      await push(`/room/${data.id}`);
    },
  });
  const cancelStrikerRoom = api.strikerRoom.cancelRoom.useMutation({
    async onSuccess() {
      await refetch();
    },
  });

  const { register, getValues } = useForm<Inputs>();

  const handleCreate = () => {
    const data = getValues();
    createStrikerRoom.mutate({
      configId: data.configId,
      bestOf: Number(data.bestOf),
    });
  };

  const handleCancel = (id: string) => {
    cancelStrikerRoom.mutate({ id });
  };

  if (!session) {
    return <p>Please sign in to use Striker.</p>;
  }

  return (
    <div className="mt-4 flex flex-col justify-center">
      <div className="mb-8 flex justify-center pb-2 text-6xl leading-8 tracking-tight">
        Striker
      </div>
      {loadingRooms ||
      createStrikerRoom.isLoading ||
      cancelStrikerRoom.isLoading ? (
        <div className="flex justify-center">
          <BeatLoader />
        </div>
      ) : (
        rooms &&
        rooms.filter((room) => room.p1Id === session.user.id).length === 0 && (
          <>
            <div className="flex flex-col">
              <form className="my-4">
                <div className="flex flex-col">
                  <div className="flex gap-2">
                    <label>Ruleset:</label>
                    <select {...register("configId")}>
                      {getConfigNamesByGame("LLB").map((config, idx) => (
                        <option key={`config-${idx}`} value={config.id}>
                          {config.name} ({config.description})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <label>Best Of:</label>
                    <select {...register("bestOf")} defaultValue={3}>
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={7}>7</option>
                      <option value={9}>9</option>
                    </select>
                  </div>
                </div>
              </form>
              <button
                className="rounded bg-green-500 px-4
             py-2 text-4xl text-white hover:bg-green-700"
                onClick={handleCreate}
              >
                Create a room
              </button>
            </div>
          </>
        )
      )}
      {rooms && rooms.length > 0 && (
        <div className="flex flex-col items-center gap-4 pt-8">
          <div>Your Active Rooms</div>
          {rooms?.map((room, idx) => (
            <div key={idx} className="flex gap-2">
              <button onClick={() => void push(`/room/${room.id}`)}>
                {room.id}
              </button>
              <button onClick={() => handleCancel(room.id)}>❌</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
