FROM node:18-alpine

WORKDIR /app

COPY frontend/package.json ./package.json
RUN npm install

COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/tsconfig.node.json ./tsconfig.node.json
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/index.html ./index.html
COPY frontend/src ./src
COPY frontend/public ./public

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
