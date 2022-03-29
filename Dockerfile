FROM makeomatic/node:$NODE_VERSION

ENV NCONF_NAMESPACE=MS_SOCIAL \
    NODE_ENV=$NODE_ENV

WORKDIR /src

# pnpm fetch does require only lockfile
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN \
  apk --update upgrade \
    && apk add git ca-certificates openssl g++ make python3 linux-headers \
    && chown node:node /src \
    && su -l node -c "cd /src && pnpm install --prod --frozen-lockfile" \
    && apk del \
    g++ \
    make \
    git \
    wget \
    python3 \
    linux-headers \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

COPY --chown=node:node . /src
USER node

EXPOSE 3000
