FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json .sequelizerc ./
COPY src ./src

ENV NODE_ENV=development
ENV AGENT_PORT=8890

EXPOSE 8890

CMD ["yarn", "dev"]
