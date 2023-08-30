/* eslint-disable @next/next/no-img-element */
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { ThemeSwitch } from "./ThemeSwitch";
import Image from "next/image";
import { useRouter } from "next/router";

export const Header = () => {
  const { push } = useRouter();
  const { data: sessionData, status: sessionStatus } = useSession();
  const userId = sessionData?.user.id;

  return (
    <header className="flex items-center justify-between py-10">
      <Image
        src={"https://i.imgur.com/9TibLdJ.png"}
        alt="Logo"
        width={64}
        height={64}
        onClick={() => void push("/")}
        className="cursor-pointer"
      />
      <div className="flex items-center text-base leading-5">
        {sessionStatus === "loading" ? (
          <BeatLoader />
        ) : sessionData ? (
          <nav
            aria-label="primary"
            className="relative z-20 hidden flex-grow flex-col pb-4 md:flex md:flex-row md:justify-end md:pb-0"
          >
            <div className="group relative">
              <button className="mt-2 flex w-full flex-row items-center rounded-lg bg-transparent px-4 py-4 text-left text-base font-bold focus:outline-none md:ml-4 md:mt-0 md:inline md:w-auto">
                <span>
                  {sessionData && (
                    <>
                      <div className="flex items-center">
                        <div className="p-1 font-medium sm:p-4">
                          Signed in as {sessionData?.user.name}
                        </div>
                        <img
                          className="h-10 w-10 rounded-full"
                          src={sessionData?.user.image ?? ""}
                          alt="Profile Picture"
                        ></img>
                      </div>
                    </>
                  )}
                </span>
              </button>
              <div className="bg-grey-200 absolute z-10 hidden group-hover:block">
                <div className="bg-white px-2 pb-4 pt-2 shadow-lg dark:bg-black">
                  <div className="grid grid-cols-1">
                    <Link
                      className="p-1 font-medium sm:p-4"
                      href={{ pathname: "/user/[userId]", query: { userId } }}
                    >
                      Profile
                    </Link>
                    <div
                      className="cursor-pointer p-1 font-medium sm:p-4"
                      onClick={() => void signOut()}
                    >
                      Sign Out
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        ) : (
          <div
            className="cursor-pointer p-1 font-medium sm:p-4"
            onClick={() => void signIn()}
          >
            Sign in
          </div>
        )}

        <ThemeSwitch />
      </div>
    </header>
  );
};
