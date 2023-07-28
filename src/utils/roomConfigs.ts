interface characterInterface {
  name: string;
  image: string;
  default?: boolean;
}

interface stageInterface {
  name: string;
  image: string;
  width: string;
  height: string;
}

interface roomConfigInterface {
  name: string;
  gameName: string;
  bestOf: number;
  numberOfBans: number;
  winnerCharacterLocked: boolean;
  legalCharacters: characterInterface[];
  legalStages: stageInterface[];
  counterpickStages: stageInterface[];
  bannedStages: stageInterface[];
}

export const roomConfigs: roomConfigInterface[] = [
  {
    name: "LLB Stadium Ruleset",
    gameName: "LLB",
    bestOf: 3,
    numberOfBans: 2,
    winnerCharacterLocked: true,
    legalCharacters: [
      { name: "Candyman", image: "https://i.imgur.com/fiIa0Wp.png" },
      { name: "Dice", image: "https://i.imgur.com/hVHrBkE.png" },
      { name: "Doombox", image: "https://i.imgur.com/JI4k9Wo.png" },
      { name: "Dust", image: "https://i.imgur.com/aabjDwX.png" },
      { name: "Grid", image: "https://i.imgur.com/eAmPWSU.png" },
      { name: "Jet", image: "https://i.imgur.com/9wRfyzA.png" },
      { name: "Latch", image: "https://i.imgur.com/3UbnjBP.png" },
      { name: "Nitro", image: "https://i.imgur.com/ZGD5PqH.png" },
      { name: "Raptor", image: "https://i.imgur.com/XfzhISG.png" },
      { name: "Sonata", image: "https://i.imgur.com/o6WcxWD.png" },
      { name: "Switch", image: "https://i.imgur.com/o9r8z6j.png" },
      { name: "Toxic", image: "https://i.imgur.com/s9xaYCu.png" },
      { name: "All", image: "https://i.imgur.com/mgwDy0f.png", default: true },
    ],
    legalStages: [
      {
        name: "Subway",
        image: "https://i.imgur.com/TQliTA8.png",
        width: "1050",
        height: "510",
      },
      {
        name: "Desert",
        image: "https://i.imgur.com/RxkSs5N.png",
        width: "1130",
        height: "510",
      },
      {
        name: "Room",
        image: "https://i.imgur.com/TB6KlRK.png",
        width: "1100",
        height: "550",
      },
      {
        name: "Outskirts",
        image: "https://i.imgur.com/R5b6ZNq.png",
        width: "1240",
        height: "510",
      },
      {
        name: "Streets",
        image: "https://i.imgur.com/gSxcB5k.png",
        width: "1320",
        height: "515",
      },
      {
        name: "Pool",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1210",
        height: "575",
      },
      {
        name: "Stadium",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1230",
        height: "540",
      },
      {
        name: "Factory",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1400",
        height: "542",
      },
      {
        name: "Elevator",
        image: "https://i.imgur.com/nRFtIK9.png",
        width: "1492",
        height: "522",
      },
    ],
    counterpickStages: [],
    bannedStages: [
      {
        name: "Sewer",
        image: "https://i.imgur.com/gf0oKf8.png",
        width: "1240",
        height: "510",
      },
    ],
  },
  {
    name: "LLB hyhy Ruleset",
    gameName: "LLB",
    bestOf: 3,
    numberOfBans: 2,
    winnerCharacterLocked: true,
    legalCharacters: [
      { name: "Candyman", image: "https://i.imgur.com/fiIa0Wp.png" },
      { name: "Dice", image: "https://i.imgur.com/hVHrBkE.png" },
      { name: "Doombox", image: "https://i.imgur.com/JI4k9Wo.png" },
      { name: "Dust", image: "https://i.imgur.com/aabjDwX.png" },
      { name: "Grid", image: "https://i.imgur.com/eAmPWSU.png" },
      { name: "Jet", image: "https://i.imgur.com/9wRfyzA.png" },
      { name: "Latch", image: "https://i.imgur.com/3UbnjBP.png" },
      { name: "Nitro", image: "https://i.imgur.com/ZGD5PqH.png" },
      { name: "Raptor", image: "https://i.imgur.com/XfzhISG.png" },
      { name: "Sonata", image: "https://i.imgur.com/o6WcxWD.png" },
      { name: "Switch", image: "https://i.imgur.com/o9r8z6j.png" },
      { name: "Toxic", image: "https://i.imgur.com/s9xaYCu.png" },
      { name: "All", image: "https://i.imgur.com/mgwDy0f.png", default: true },
    ],
    legalStages: [
      {
        name: "Subway",
        image: "https://i.imgur.com/TQliTA8.png",
        width: "1050",
        height: "510",
      },
      {
        name: "Desert",
        image: "https://i.imgur.com/RxkSs5N.png",
        width: "1130",
        height: "510",
      },
      {
        name: "Room",
        image: "https://i.imgur.com/TB6KlRK.png",
        width: "1100",
        height: "550",
      },
      {
        name: "Outskirts",
        image: "https://i.imgur.com/R5b6ZNq.png",
        width: "1240",
        height: "510",
      },
      {
        name: "Streets",
        image: "https://i.imgur.com/gSxcB5k.png",
        width: "1320",
        height: "515",
      },
    ],
    counterpickStages: [
      {
        name: "Pool",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1210",
        height: "575",
      },
      {
        name: "Stadium",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1230",
        height: "540",
      },
      {
        name: "Factory",
        image: "https://i.imgur.com/8xhB7na.png",
        width: "1400",
        height: "542",
      },
      {
        name: "Elevator",
        image: "https://i.imgur.com/nRFtIK9.png",
        width: "1492",
        height: "522",
      },
    ],
    bannedStages: [
      {
        name: "Sewer",
        image: "https://i.imgur.com/gf0oKf8.png",
        width: "1240",
        height: "510",
      },
    ],
  },
];

export const getConfigNamesByGame = (game: string): string[] => {
  return roomConfigs
    .filter((config) => config.gameName === game)
    .map((config) => config.name);
};

export const getConfigByName = (name: string): roomConfigInterface => {
  const config = roomConfigs.find((config) => config.name === name);
  if (!config) return roomConfigs[0]!;
  return config;
};
