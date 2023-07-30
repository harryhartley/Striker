import { Character, RoomStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { pusherServerClient } from "../../common/pusher";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function randomIntFromIntervalInc(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const strikerRoomRouter = createTRPCRouter({
  createRoom: protectedProcedure.mutation(async ({ ctx }) => {
    const exists = await ctx.prisma.strikerRoom.findFirst({
      where: {
        p1Id: ctx.session.user.id,
        roomStatus: { in: ["Active", "Inactive"] },
      },
    });
    if (!!exists) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Room already exists",
      });
    }
    return ctx.prisma.strikerRoom.create({
      data: {
        p1Id: ctx.session.user.id,
      },
    });
  }),
  getIncompleteRoomsByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.strikerRoom.findMany({
      where: {
        p1Id: ctx.session.user.id,
        roomStatus: { in: ["Active", "Inactive"] },
      },
    });
  }),
  getRoomById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.strikerRoom.findUnique({
        where: { id: input.id },
        include: {
          p1: { select: { name: true } },
          p2: { select: { name: true } },
        },
      });
    }),
  setP2Id: protectedProcedure
    .input(z.object({ id: z.string().cuid(), p2Id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const firstBan = randomIntFromIntervalInc(1, 2);
      const setP2Id = await ctx.prisma.strikerRoom.update({
        data: { p2Id: input.p2Id, firstBan },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "set-p2-id", {
        p2Id: input.p2Id,
      });
      return setP2Id;
    }),
  setRoomStatus: protectedProcedure
    .input(
      z.object({ id: z.string().cuid(), roomStatus: z.nativeEnum(RoomStatus) })
    )
    .mutation(async ({ ctx, input }) => {
      const setRoomStatus = ctx.prisma.strikerRoom.update({
        data: { roomStatus: input.roomStatus },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "set-room-status", {
        roomStatus: input.roomStatus,
      });
      return setRoomStatus;
    }),
  setRoomState: protectedProcedure
    .input(z.object({ id: z.string().cuid(), roomState: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const setRoomState = await ctx.prisma.strikerRoom.update({
        data: { roomState: input.roomState },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "set-room-state", {
        roomState: input.roomState,
      });
      return setRoomState;
    }),
  setCurrentScore: protectedProcedure
    .input(z.object({ id: z.string().cuid(), currentScore: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const setCurrentScore = await ctx.prisma.strikerRoom.update({
        data: { currentScore: input.currentScore },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(
        `room-${input.id}`,
        "set-current-score",
        {
          currentScore: input.currentScore,
        }
      );
      return setCurrentScore;
    }),
  setCharacter: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        character: z.nativeEnum(Character),
        playerNumber: z.number().int().min(1).max(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setCharacter = await ctx.prisma.strikerRoom.update({
        data: { [`p${input.playerNumber}SelectedCharacter`]: input.character },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "set-character", {
        character: input.character,
        playerNumber: input.playerNumber,
      });
      return setCharacter;
    }),
  setCharacterLocked: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        characterLocked: z.boolean(),
        playerNumber: z.number().int().min(1).max(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setCharacterLocked = await ctx.prisma.strikerRoom.update({
        data: {
          [`p${input.playerNumber}CharacterLocked`]: input.characterLocked,
        },
        where: { id: input.id },
      });
      const bothCharactersLocked =
        setCharacterLocked.p1CharacterLocked &&
        setCharacterLocked.p2CharacterLocked;
      if (bothCharactersLocked) {
        await pusherServerClient.trigger(
          `room-${input.id}`,
          "both-characters-locked",
          { roomState: setCharacterLocked.roomState + 1 }
        );
        await ctx.prisma.strikerRoom.update({
          data: {
            roomState: setCharacterLocked.roomState + 1,
            p1CharacterLocked: false,
            p2CharacterLocked: false,
          },
          where: {
            id: input.id,
          },
        });
      } else {
        await pusherServerClient.trigger(
          `room-${input.id}`,
          `set-character-locked`,
          {
            characterLocked: input.characterLocked,
            playerNumber: input.playerNumber,
          }
        );
      }
      return setCharacterLocked;
    }),
  setMostRecentWinner: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        mostRecentWinner: z.number().int().min(1).max(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setMostRecentWinner = await ctx.prisma.strikerRoom.update({
        data: { mostRecentWinner: input.mostRecentWinner },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(
        `room-${input.id}`,
        "set-most-recent-winner",
        {
          mostRecentWinner: input.mostRecentWinner,
        }
      );
      return setMostRecentWinner;
    }),
  setSelectedStage: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        selectedStage: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setSelectedStage = await ctx.prisma.strikerRoom.update({
        data: { selectedStage: input.selectedStage },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(
        `room-${input.id}`,
        "set-selected-stage",
        {
          selectedStage: input.selectedStage,
        }
      );
      return setSelectedStage;
    }),
  setCurrentBans: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        currentBans: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setCurrentBans = await ctx.prisma.strikerRoom.update({
        data: { currentBans: input.currentBans },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "set-current-bans", {
        currentBans: input.currentBans,
      });
      return setCurrentBans;
    }),
});
