import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { push } = useRouter();
  const createStrikerRoom = api.strikerRoom.createRoom.useMutation({
    async onSuccess(data) {
      await push(`/room/${data.id}`);
    },
  });

  const handleSubmit = () => {
    createStrikerRoom.mutate();
  };

  return <button onClick={handleSubmit}>Create a room</button>;
};

export default Home;
