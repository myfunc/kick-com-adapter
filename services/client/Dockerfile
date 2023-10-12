FROM node:18 as development

RUN apt-get update && apt-get install -y bash

WORKDIR /usr/src

ARG PORT
ENV PORT="$PORT"

COPY ./entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["/bin/bash", "/usr/src/entrypoint.sh"]