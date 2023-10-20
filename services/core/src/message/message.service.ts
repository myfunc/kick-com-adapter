import { Injectable } from "@nestjs/common";
import {
    KickService,
    OnMessageHandler,
} from "src/integrations/kick/kick.service";

@Injectable()
export class MessageService {
    kick: KickService;

    constructor(kickService: KickService) {
        this.kick = kickService;
    }

    public async subscribeToChat(
        channelName: string,
        handler: OnMessageHandler
    ) {
        const channel = await this.kick.getChannelInfo(channelName);

        if (!channel?.chatroom) {
            return false;
        }

        this.kick.onMessage(channel!.chatroom!.id.toString(), handler);

        return true;
    }

    public async unsubscribeFromChat(
        channelName: any,
        handler: (message: any) => void
    ) {
        const channel = await this.kick.getChannelInfo(channelName); // can be optimized;

        if (!channel?.chatroom) {
            return false;
        }

        this.kick.offMessages(channel!.chatroom!.id.toString(), handler);
    }
}
