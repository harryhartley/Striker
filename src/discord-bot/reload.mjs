import { REST, Routes } from "discord.js";
import { config } from "dotenv";

config();

const commands = [
  {
    name: "striker",
    description: "Create a new Striker room",
    options: [
      {
        type: 6,
        name: "opponent",
        description: "The opponent to challenge",
        required: false,
      },
      {
        type: 3,
        name: "ruleset",
        description: "The ruleset to use",
        required: false,
        choices: [
          {
            name: "stadium",
            value: "clkp7ja74000008ju9zmg06n6",
          },
          {
            name: "uk",
            value: "clkp7jt33000108ju86xxdl51",
          },
        ],
      },
      {
        type: 3,
        name: "bestof",
        description: "The number of games to play",
        required: false,
        choices: [
          {
            name: "3",
            value: "3",
          },
          {
            name: "5",
            value: "5",
          },
        ],
      },
    ],
  },
  {
    name: "cancel",
    description: "Cancel an existing Striker room",
  },
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN ?? ""
);

try {
  console.log("Started refreshing application (/) commands.");

  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID ?? ""),
    {
      body: commands,
    }
  );

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}
