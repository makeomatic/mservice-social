FROM makeomatic/node:$NODE_VERSION

ENV NCONF_NAMESPACE=MS_SOCIAL \
    NODE_ENV=$NODE_ENV

WORKDIR /src

COPY --chown=node:node pnpm-lock.yaml ./
RUN \
  apk --update upgrade \
  && apk add ca-certificates openssl --virtual .buildDeps wget git g++ make python3 linux-headers \
  && update-ca-certificates \
  && chown node:node /src \
  && su node -c "cd /src && pnpm fetch --prod" \
  && su node -c 'rm -rf ~/.npmrc ~/.cache && pnpm store prune' \
  && apk del .buildDeps \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

USER node
COPY --chown=node:node . /src
RUN pnpm install --prod --offline

EXPOSE 3000

CMD [ "./node_modules/.bin/mfleet" ]
