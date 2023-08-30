import { Prisma } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fallbackCharacter,
  getConfigById,
  getStageByConfig,
} from "~/utils/roomConfigs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/router";
import Image from "next/image";
import { api } from "~/utils/api";
import { ClipboardIcon, TrashIcon } from "@heroicons/react/20/solid";

const roomWithUsers = Prisma.validator<Prisma.StrikerRoomDefaultArgs>()({
  include: { p1: { select: { name: true } }, p2: { select: { name: true } } },
});
type OverviewCardProps = Prisma.StrikerRoomGetPayload<typeof roomWithUsers>;

export const OverviewCard = ({
  id,
  currentScore,
  p1SelectedCharacter,
  p2SelectedCharacter,
  configId,
  p1,
  p2,
  selectedStage,
}: OverviewCardProps) => {
  const { push } = useRouter();
  const utils = api.useContext();

  const cancelStrikerRoom = api.strikerRoom.cancelRoom.useMutation({
    onSuccess: () => utils.strikerRoom.getIncompleteRoomsByUserId.invalidate(),
  });
  const handleCancel = () => {
    cancelStrikerRoom.mutate({ id });
  };

  const p1Character =
    getConfigById(configId).legalCharacters.find(
      (x) => x.name === p1SelectedCharacter
    ) ?? fallbackCharacter;
  const p2Character =
    getConfigById(configId).legalCharacters.find(
      (x) => x.name === p2SelectedCharacter
    ) ?? fallbackCharacter;
  const score = currentScore.split(",");
  const stage = getStageByConfig(configId, selectedStage);

  return (
    <Card>
      <CardHeader>
        <CardTitle
          onClick={() => void push(`/room/${id}`)}
          className="flex cursor-pointer flex-row items-center justify-around"
        >
          <Avatar>
            <AvatarImage src={p1Character.image} />
            <AvatarFallback>{p1Character.name}</AvatarFallback>
          </Avatar>
          vs.
          <Avatar>
            <AvatarImage src={p2Character.image} />
            <AvatarFallback>{p2Character.name}</AvatarFallback>
          </Avatar>
        </CardTitle>
        <CardDescription
          onClick={() => void push(`/room/${id}`)}
          className="flex cursor-pointer flex-row items-center justify-around"
        >
          <p>{score[0]}</p>
          <p>{p1.name}</p>
          <p>-</p>
          <p>{p2?.name ?? "..."}</p>
          <p>{score[1]}</p>
        </CardDescription>
      </CardHeader>
      <CardContent
        onClick={() => void push(`/room/${id}`)}
        className="cursor-pointer"
      >
        <Image src={stage.image} alt={stage.name} width={200} height={200} />
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-between">
        <ClipboardIcon
          height={24}
          width={24}
          onClick={() =>
            void navigator.clipboard.writeText(`https://strkr.hyhy.gg/${id}`)
          }
          className="cursor-pointer text-gray-800 hover:text-gray-500"
        />
        <TrashIcon
          height={24}
          width={24}
          onClick={() => handleCancel()}
          className="cursor-pointer text-red-600 hover:text-red-400"
        />
      </CardFooter>
    </Card>
  );
};
