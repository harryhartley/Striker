import { createTRPCRouter } from "~/server/api/trpc";
import { gameRouter } from "./routers/game";
import { strikerRoomRouter } from "./routers/strikerRoom";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  strikerRoom: strikerRoomRouter,
  game: gameRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
