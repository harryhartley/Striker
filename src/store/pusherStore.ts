import type Pusher from "pusher-js";
import { create } from "zustand";
import { pusherClient } from "~/server/common/pusherClient";

interface IPusherStore {
  pusherClient: Pusher;
}

export const usePusherStore = create<IPusherStore>((set) => ({
  pusherClient,
}));
