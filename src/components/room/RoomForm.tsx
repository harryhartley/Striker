"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api } from "~/utils/api";
import { getConfigNamesByGame } from "~/utils/roomConfigs";

const formSchema = z.object({
  configId: z.string(),
  bestOf: z.number(),
});

export const RoomForm = () => {
  const { push } = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const createStrikerRoom = api.strikerRoom.createRoom.useMutation({
    async onSuccess(data) {
      await push(`/room/${data.id}`);
    },
  });

  const handleCreate = () => {
    const data = form.getValues();
    createStrikerRoom.mutate({
      configId: data.configId,
      bestOf: Number(data.bestOf),
    });
  };

  return (
    <div className="flex flex-col">
      <form className="my-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-8">
            <label>Ruleset:</label>
            <select {...form.register("configId")}>
              {getConfigNamesByGame("LLB").map((config, idx) => (
                <option
                  key={`config-${idx}`}
                  value={config.id}
                  selected={idx === 0}
                >
                  {config.name} ({config.description})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-8">
            <label>Best Of:</label>
            <select {...form.register("bestOf")} defaultValue={3}>
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={9}>9</option>
            </select>
          </div>
        </div>
      </form>
      <Button
        className="h-12"
        variant={"outline"}
        size={"lg"}
        onClick={handleCreate}
      >
        Create a room
      </Button>
    </div>
  );
};
