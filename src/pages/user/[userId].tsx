/* eslint-disable @next/next/no-img-element */
import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { Pagination } from "~/components/Pagination";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { query } = useRouter();

  const { data, isLoading } =
    api.strikerRoom.getRoomsByParticipationWithGames.useQuery(
      { userId: query.userId as string, currentPage, pageSize },
      {
        enabled: typeof query.userId === "string",
        refetchOnWindowFocus: false,
      }
    );

  if (typeof query.userId !== "string") return <p>Bad ID</p>;

  return (
    <main>
      {isLoading ? (
        <div className="flex justify-center">
          <BeatLoader />
        </div>
      ) : data ? (
        <div>
          {data && data.length > 0 ? (
            <>
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemCount={data.length}
                pageSize={pageSize}
              />

              <ul className="divide-y">
                {!data
                  ? "Loading matches..."
                  : data.length === 0
                  ? "No plays found"
                  : data.map((match, idx) => (
                      <li key={idx}>
                        <div className="flex flex-col">
                          {match.games.map((game, idx) => (
                            <div key={`game-${idx}`}>
                              {game.createdAt.toDateString()} -{" "}
                              {query.userId === game.p1Id
                                ? `${game.p1Character} ${game.stageName} ${
                                    game.winner === 1 ? "W" : "L"
                                  }`
                                : `${game.p2Character} ${game.stageName} ${
                                    game.winner === 2 ? "W" : "L"
                                  }`}
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : (
        <div>No data found</div>
      )}
    </main>
  );
};

export default Home;
