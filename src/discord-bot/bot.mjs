import { PrismaClient, RoomStatus } from "@prisma/client";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";

config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const prisma = new PrismaClient();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "striker") {
    const user = await prisma.user.findFirst({
      where: { accounts: { some: { providerAccountId: interaction.user.id } } },
      select: { id: true },
    });
    if (!!user) {
      const exists = await prisma.strikerRoom.findFirst({
        where: {
          p1Id: user.id,
          roomStatus: { in: ["Active", "Inactive"] },
        },
      });

      if (!exists) {
        const room = await prisma.strikerRoom.create({
          data: {
            p1Id: user.id,
            configId: "clkp7ja74000008ju9zmg06n6",
            bestOf: 3,
          },
        });
        await interaction.reply(
          `New room created: https://strkr.hyhy.gg/room/${room.id}`
        );
      } else {
        await interaction.reply(
          `Room already exists: https://strkr.hyhy.gg/room/${exists.id}`
        );
      }
    } else {
      await interaction.reply(
        `User not found. Please sign in at least once at https://strkr.hyhy.gg`
      );
    }
  }

  if (interaction.commandName === "cancel") {
    const user = await prisma.user.findFirst({
      where: { accounts: { some: { providerAccountId: interaction.user.id } } },
      select: { id: true },
    });
    if (!!user) {
      const exists = await prisma.strikerRoom.findFirst({
        where: {
          p1Id: user.id,
          roomStatus: { in: ["Active", "Inactive"] },
        },
      });

      if (!exists) {
        await interaction.reply(
          `No room exists. Please create a new room with /striker`
        );
      } else {
        await prisma.strikerRoom.update({
          where: { id: exists.id },
          data: { roomStatus: RoomStatus.Canceled },
        });
        await interaction.reply(
          `Room canceled. Please create a new room with /striker`
        );
      }
    } else {
      await interaction.reply(
        `User not found. Please sign in at least once at https://strkr.hyhy.gg`
      );
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
