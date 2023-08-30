import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { BeatLoader } from "react-spinners";
import { OverviewCard } from "~/components/room/OverviewCard";
import { api } from "~/utils/api";
import { RoomForm } from "~/components/room/RoomForm";

const Home: NextPage = () => {
  const { data: session } = useSession();

  const { data: rooms, isLoading: loadingRooms } =
    api.strikerRoom.getIncompleteRoomsByUserId.useQuery(undefined, {
      enabled: !!session,
      refetchOnWindowFocus: false,
    });

  return (
    <div className="mt-4 flex flex-col justify-center">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="rounded-2xl px-4 py-1.5 text-6xl font-medium">
            Striker
          </h1>
          <p className="max-w-[42rem] text-xl leading-normal text-gray-500 sm:text-3xl sm:leading-8">
            Tournament Set Management
          </p>
        </div>
      </section>
      {!session ? (
        <div className="flex justify-center">
          <p className="max-w-[42rem] text-lg leading-normal sm:text-xl sm:leading-8">
            Please sign in to create a Striker room
          </p>
        </div>
      ) : loadingRooms ? (
        <div className="flex justify-center">
          <BeatLoader />
        </div>
      ) : (
        rooms &&
        rooms.filter((room) => room.p1Id === session.user.id).length === 0 && (
          <RoomForm />
        )
      )}
      {rooms && rooms.length > 0 && (
        <div className="flex flex-col items-center gap-4 pt-8">
          <div>Your Active Rooms</div>
          <div className="flex flex-row gap-4">
            {rooms?.slice(0, 3).map((room, idx) => (
              <OverviewCard key={idx} {...room} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
