import { Character } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const gameRouter = createTRPCRouter({
  createGame: protectedProcedure
    .input(z.object({
      roomId: z.string().cuid(),
      number: z.number(),
      stageName: z.string(),
      p1Character: z.nativeEnum(Character),
      p2Character: z.nativeEnum(Character),
      p1Id: z.string().cuid(),
      p2Id: z.string().cuid(),
      winner: z.number()
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.create({
        data: {
          roomId: input.roomId,
          number: input.number,
          stageName: input.stageName,
          p1Character: input.p1Character,
          p2Character: input.p2Character,
          p1Id: input.p1Id,
          p2Id: input.p2Id,
          winner: input.winner
        }
      })
  })
})