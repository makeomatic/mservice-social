FROM makeomatic/node:$NODE_VERSION

ENV NCONF_NAMESPACE=MS_SOCIAL \
    NODE_ENV=$NODE_ENV

WORKDIR /src

RUN \
  apk --update upgrade \
    && apk add git ca-certificates openssl g++ make python3 linux-headers \
    && chown node:node /src \
    && su -l node -c "cd /src && pnpm install --prod --frozen-lockfile" \
    && apk del \
    g++ \
    make \
    git \
    curl \
  && apk add openssl ca-certificates \
  && update-ca-certificates \
  && apk del \
    .buildDeps \
    wget \
    python3 \
    linux-headers \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

COPY --chown=node:node package.json pnpm-lock.yaml ./
USER node
RUN pnpm i --production --frozen-lockfile
COPY --chown=node:node . /src

EXPOSE 3000
