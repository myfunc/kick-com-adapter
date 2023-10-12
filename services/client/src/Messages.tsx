import React from "react";

interface Props {
    messages: string[];
}

export const Messages: React.FC<Props> = ({ messages }) => {
    return (
        <div className="container pt-3">
            {messages.map((message, index) => (
                <div key={index} className="alert alert-secondary" role="alert">
                    {message}
                </div>
            ))}
        </div>
    );
};
