import { Controller, Param, Sse } from "@nestjs/common";
import { MessageService } from "../message.service";
import { Observable } from "rxjs";

@Controller("messages")
export class MessageController {
    constructor(private messageService: MessageService) {}

    @Sse(":channelName")
    async subscribeToChat(@Param("channelName") channelName) {
        return new Observable((observer) => {
            const handler = (message) => {
                observer.next({
                    data: JSON.stringify(message),
                });
            };

            this.messageService.subscribeToChat(channelName, handler);

            return () => {
                this.messageService.unsubscribeFromChat(channelName, handler);
            };
        });
    }
}
