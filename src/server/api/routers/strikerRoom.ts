import { Character, RoomStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { pusherServerClient } from "../../common/pusher";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function randomIntFromIntervalInc(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const strikerRoomRouter = createTRPCRouter({
  createRoom: protectedProcedure
    .input(
      z.object({
        configId: z.string().cuid(),
        bestOf: z.number(),
        steamUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          configId: input.configId,
          bestOf: input.bestOf,
          steamUrl: input.steamUrl,
        },
      });
    }),
  cancelRoom: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const cancelRoom = await ctx.prisma.strikerRoom.deleteMany({
        where: {
          id: input.id,
          p1Id: ctx.session.user.id,
          roomStatus: { in: ["Active", "Inactive"] },
        },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "cancel-room", {});
      return cancelRoom;
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
      const p2Exists = await ctx.prisma.strikerRoom.findFirst({
        where: {
          id: input.id,
        },
      });
      if (p2Exists?.p2Id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "P2 already exists",
        });
      }
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
    // need some serverside validation here, not sure how to do it
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
          requester: ctx.session.user.id,
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
        requester: ctx.session.user.id,
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
        stageName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setMostRecentWinner = await ctx.prisma.strikerRoom.update({
        data: { mostRecentWinner: input.mostRecentWinner },
        where: { id: input.id },
      });
      await ctx.prisma.strikerRoom.update({
        where: { id: setMostRecentWinner.id },
        data: {
          games: {
            create: {
              number: setMostRecentWinner.currentScore
                .split(",")
                .map((score) => parseInt(score))
                .reduce((a, b) => a + b, 0),
              stageName: input.stageName,
              p1Character: setMostRecentWinner.p1SelectedCharacter,
              p2Character: setMostRecentWinner.p2SelectedCharacter,
              p1Id: setMostRecentWinner.p1Id,
              p2Id: setMostRecentWinner.p2Id ?? "",
              winner: input.mostRecentWinner,
            },
          },
        },
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
          requester: ctx.session.user.id,
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
        requester: ctx.session.user.id,
      });
      return setCurrentBans;
    }),
  addGame: protectedProcedure
    .input(
      z.object({
        roomId: z.string().cuid(),
        number: z.number(),
        stageName: z.string(),
        p1Character: z.nativeEnum(Character),
        p2Character: z.nativeEnum(Character),
        p1Id: z.string().cuid(),
        p2Id: z.string().cuid(),
        winner: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.strikerRoom.update({
        where: { id: input.roomId },
        data: {
          games: {
            create: {
              number: input.number,
              stageName: input.stageName,
              p1Character: input.p1Character,
              p2Character: input.p2Character,
              p1Id: input.p1Id,
              p2Id: input.p2Id,
              winner: input.winner,
            },
          },
        },
      });
    }),
  getRoomsByParticipationWithGames: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        currentPage: z.number(),
        pageSize: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.strikerRoom.findMany({
        where: {
          OR: [
            {
              roomStatus: RoomStatus.Complete,
              p1Id: input.userId,
            },
            {
              roomStatus: RoomStatus.Complete,
              p2Id: input.userId,
            },
          ],
        },
        skip: (input.currentPage - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: [{ createdAt: "desc" }],
        include: {
          games: true,
        },
      });
    }),
});
