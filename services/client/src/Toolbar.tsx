import React from "react";
import { API_URL } from ".";

interface Props {
    channelName: string;
    onChannelNameChange: (name: string) => void;
    onNewMessage: (message: string) => void;
}

export const Toolbar: React.FC<Props> = ({
    channelName,
    onChannelNameChange,
    onNewMessage,
}) => {
    const [eventSource, setEventSource] = React.useState<EventSource | null>(
        null
    );

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChannelNameChange(event.target.value);
    };

    const handleButtonClick = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }

        const es = new EventSource(`${API_URL}/api/messages/${channelName}`);
        es.onmessage = (event) => {
            const message = event.data;
            if (message) {
                onNewMessage(message);
            }
        };

        setEventSource(es);
    };

    return (
        <div className="fixed-bottom p-2 bg-light d-flex justify-content-center align-items-center">
            <input
                type="text"
                className="form-control me-3"
                value={channelName}
                onChange={handleInputChange}
                placeholder="channel name"
            />
            <button className="btn btn-primary" onClick={handleButtonClick}>
                monitor
            </button>
        </div>
    );
};
