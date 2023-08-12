import { REST, Routes } from "discord.js";
import { config } from "dotenv";

config();

const commands = [
  {
    name: "striker",
    description: "Create a new Striker room",
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
