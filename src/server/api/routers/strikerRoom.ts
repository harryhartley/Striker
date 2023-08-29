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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: {
          id: input.id,
          p1Id: ctx.session.user.id,
          roomStatus: { in: ["Active", "Inactive"] },
        },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      const cancelRoom = await ctx.prisma.strikerRoom.update({
        where: {
          id: input.id,
          p1Id: ctx.session.user.id,
          roomStatus: { in: ["Active", "Inactive"] },
        },
        data: { roomStatus: RoomStatus.Canceled },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "cancel-room", {});
      return cancelRoom;
    }),
  getIncompleteRoomsByUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.strikerRoom.findMany({
      where: {
        OR: [
          {
            p1Id: ctx.session.user.id,
            roomStatus: { in: ["Active", "Inactive"] },
          },
          {
            p2Id: ctx.session.user.id,
            roomStatus: { in: ["Active", "Inactive"] },
          },
        ],
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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: {
          id: input.id,
        },
      });
      if (
        !!room?.p2Id ||
        room?.roomStatus !== RoomStatus.Inactive ||
        room.roomState !== 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room update forbidden",
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
  removeP2Id: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: {
          id: input.id,
        },
      });
      if (
        !room?.p2Id ||
        room?.roomStatus !== RoomStatus.Inactive ||
        room.roomState !== 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room update forbidden",
        });
      }
      const removeP2Id = await ctx.prisma.strikerRoom.update({
        data: { p2Id: null, firstBan: 0 },
        where: { id: input.id },
      });
      await pusherServerClient.trigger(`room-${input.id}`, "remove-p2-id", {});
      return removeP2Id;
    }),
  setRoomStatus: protectedProcedure
    .input(
      z.object({ id: z.string().cuid(), roomStatus: z.nativeEnum(RoomStatus) })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
      if (
        (room?.roomStatus === RoomStatus.Inactive &&
          (input.roomStatus === RoomStatus.Active ||
            input.roomStatus === RoomStatus.Canceled)) ||
        (room?.roomStatus === RoomStatus.Active &&
          (input.roomStatus === RoomStatus.Complete ||
            input.roomStatus === RoomStatus.Canceled))
      ) {
        const setRoomStatus = ctx.prisma.strikerRoom.update({
          data: { roomStatus: input.roomStatus },
          where: { id: input.id },
        });
        await pusherServerClient.trigger(
          `room-${input.id}`,
          "set-room-status",
          {
            roomStatus: input.roomStatus,
          }
        );
        return setRoomStatus;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room status update not valid",
        });
      }
    }),
  advanceRoomState: protectedProcedure
    .input(z.object({ id: z.string().cuid(), roomState: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
      if (
        typeof room?.roomState === "number" &&
        room.roomState + 1 === input.roomState
      ) {
        const setRoomState = await ctx.prisma.strikerRoom.update({
          data: { roomState: input.roomState },
          where: { id: input.id },
        });
        await pusherServerClient.trigger(`room-${input.id}`, "set-room-state", {
          roomState: input.roomState,
        });
        return setRoomState;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update not valid",
        });
      }
    }),
  setCurrentScore: protectedProcedure
    .input(z.object({ id: z.string().cuid(), currentScore: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState == "number" &&
        room?.roomState % 3 !== 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
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
        requesterNumber: z.number().int().min(1).max(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState == "number" &&
        room?.roomState % 3 !== 1
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
      if (
        typeof room?.roomState === "number" &&
        room?.roomState % 3 === 1 &&
        ((input.requesterNumber === 1 && !room.p1CharacterLocked) ||
          (input.requesterNumber === 2 && !room.p2CharacterLocked))
      ) {
        const setCharacter = await ctx.prisma.strikerRoom.update({
          data: {
            [`p${input.playerNumber}SelectedCharacter`]: input.character,
          },
          where: { id: input.id },
        });
        await pusherServerClient.trigger(`room-${input.id}`, "set-character", {
          character: input.character,
          playerNumber: input.playerNumber,
          requester: ctx.session.user.id,
        });
        return setCharacter;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Character update not valid",
        });
      }
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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState == "number" &&
        room?.roomState % 3 !== 1
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
        include: { games: true },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState == "number" &&
        room?.roomState % 3 !== 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
      const setMostRecentWinner = await ctx.prisma.strikerRoom.update({
        data: { mostRecentWinner: input.mostRecentWinner },
        where: { id: input.id },
      });
      await ctx.prisma.strikerRoom.update({
        where: { id: setMostRecentWinner.id },
        data: {
          games: {
            create: {
              number: (room?.games.length ?? 0) + 1,
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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
        include: { games: true },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState == "number" &&
        room?.roomState % 3 !== 2
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
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
      const room = await ctx.prisma.strikerRoom.findFirst({
        where: { id: input.id },
        include: { games: true },
      });
      if (
        room?.p1Id !== ctx.session.user.id &&
        room?.p2Id !== ctx.session.user.id &&
        typeof room?.roomState === "number" &&
        room?.roomState % 3 !== 2
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Room state update forbidden",
        });
      }
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
  revertToLastSafeState: protectedProcedure
    .input(z.object({ id: z.string().cuid(), requesterNumber: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.prisma.strikerRoom.findUnique({
        where: { id: input.id },
      });
      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }
      if (room.revertRequested === 0) {
        await ctx.prisma.strikerRoom.update({
          where: { id: input.id },
          data: { revertRequested: input.requesterNumber },
        });
        await pusherServerClient.trigger(
          `room-${input.id}`,
          "revert-requested",
          {
            requesterNumber: input.requesterNumber,
            requester: ctx.session.user.id,
          }
        );
      } else {
        if (room.revertRequested === input.requesterNumber) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Revert already requested",
          });
        }
        const previousScore = room.currentScore
          .split(",")
          .map((score, idx) => {
            if (idx + 1 === room.mostRecentWinner) {
              return (parseInt(score) - 1).toString();
            }
          })
          .join(",");
        const revertedRoom = await ctx.prisma.strikerRoom.update({
          where: { id: input.id },
          data: {
            revertRequested: 0,
            currentScore: previousScore,
            currentBans: "",
            roomState: 3,
            p1CharacterLocked: false,
            p2CharacterLocked: false,
            // mostRecentWinner: 0, // store this somewhere
            // p1SelectedCharacter
            // p2SelectedCharacter
            // selectedStage
          },
        });
        await pusherServerClient.trigger(`room-${input.id}`, "revert-room", {
          requester: ctx.session.user.id,
        });
        return revertedRoom;
      }
    }),
});
