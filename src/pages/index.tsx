import { type NextPage } from "next";
import { useRouter } from "next/router";
import { BeatLoader } from "react-spinners";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { push } = useRouter();

  const {
    data: rooms,
    isLoading: loadingRooms,
    refetch,
  } = api.strikerRoom.getIncompleteRoomsByUserId.useQuery(undefined, {
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

  const handleSubmit = () => {
    createStrikerRoom.mutate();
  };

  const handleCancel = (id: string) => {
    cancelStrikerRoom.mutate({ id });
  };

  return (
    <div className="mt-4 flex justify-center">
      {loadingRooms ? (
        <BeatLoader />
      ) : rooms && rooms.length === 0 ? (
        <button
          className="rounded bg-green-500 px-4
             py-2 text-4xl font-bold text-white hover:bg-green-700"
          onClick={handleSubmit}
        >
          Create a room
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
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
