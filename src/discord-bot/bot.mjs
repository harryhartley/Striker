import { PrismaClient, RoomStatus } from '@prisma/client'
import { Client, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'

config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const prisma = new PrismaClient()
const domain = 'https://strkr.hyhy.gg'
const defaultConfig = 'clkp7ja74000008ju9zmg06n6'

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === 'striker') {
    const opponentObject = interaction.options.data.find(
      (o) => o.name === 'opponent'
    )?.user
    const opponentId = opponentObject?.id
    const ruleset = interaction.options.data.find(
      (o) => o.name === 'ruleset'
    )?.value
    const bestOf = interaction.options.data.find(
      (o) => o.name === 'bestof'
    )?.value

    const user = await prisma.user.findFirst({
      where: { accounts: { some: { providerAccountId: interaction.user.id } } },
      select: { id: true },
    })
    if (!!user) {
      const exists = await prisma.strikerRoom.findFirst({
        where: {
          p1Id: user.id,
          roomStatus: { in: ['Active', 'Inactive'] },
        },
      })

      if (!exists) {
        if (!!opponentId) {
          if (opponentId === interaction.user.id) {
            await interaction.reply(
              `You cannot challenge yourself. Please specify an opponent.`
            )
          } else {
            const opponent = await prisma.user.findFirst({
              where: {
                accounts: { some: { providerAccountId: opponentId } },
              },
              select: { id: true },
            })
            if (!!opponent) {
              const room = await prisma.strikerRoom.create({
                data: {
                  p1Id: user.id,
                  // p2Id: opponent.id,
                  configId: ruleset?.toString() ?? defaultConfig,
                  bestOf: bestOf === undefined ? 3 : Number(bestOf),
                  firstBan: Math.floor(Math.random() * 2 + 1),
                },
              })
              await interaction.reply(
                `New room with opponent ${opponentObject.toString()}: ${domain}/room/${
                  room.id
                }`
              )
            } else {
              await interaction.reply(
                `${opponentObject.toString()} not found. Please sign in at least once at ${domain}`
              )
            }
          }
        } else {
          const room = await prisma.strikerRoom.create({
            data: {
              p1Id: user.id,
              configId: ruleset?.toString() ?? defaultConfig,
              bestOf: bestOf === undefined ? 3 : Number(bestOf),
            },
          })
          await interaction.reply(`New room created: ${domain}/room/${room.id}`)
        }
      } else {
        await interaction.reply(
          `Room already exists: ${domain}/room/${exists.id}`
        )
      }
    } else {
      await interaction.reply(
        `User not found. Please sign in at least once at ${domain}`
      )
    }
  }

  if (interaction.commandName === 'cancel') {
    const user = await prisma.user.findFirst({
      where: { accounts: { some: { providerAccountId: interaction.user.id } } },
      select: { id: true },
    })
    if (!!user) {
      const exists = await prisma.strikerRoom.findFirst({
        where: {
          p1Id: user.id,
          roomStatus: { in: ['Active', 'Inactive'] },
        },
      })

      if (!exists) {
        await interaction.reply(
          `No room exists. Please create a new room with /striker`
        )
      } else {
        await prisma.strikerRoom.update({
          where: { id: exists.id },
          data: { roomStatus: RoomStatus.Canceled },
        })
        await interaction.reply(
          `Room canceled. Please create a new room with /striker`
        )
      }
    } else {
      await interaction.reply(
        `User not found. Please sign in at least once at ${domain}`
      )
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN ?? '').catch((e) => {
  console.error(e)
})
