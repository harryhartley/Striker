import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";

const Home: NextPage = () => {
  const user = useUser();

  return (
    <>
      <h1>Striker</h1>
      {!user.isSignedIn && <SignInButton />}
			{user.isSignedIn && <UserButton afterSignOutUrl="/"/>}
      <div>Strike Stages</div>
    </>
  );
};

export default Home;
