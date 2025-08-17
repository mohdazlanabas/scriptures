
# --- Build API/Worker ---
FROM golang:1.22-alpine AS gobuild
WORKDIR /app/backend
COPY backend/go.mod ./
RUN go mod download
COPY backend ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/worker ./cmd/worker

# --- Build Frontend ---
FROM node:20-alpine AS webbuild
WORKDIR /web
COPY web/package.json web/tsconfig.json web/tailwind.config.ts web/postcss.config.js web/index.html ./
COPY web/src ./src
RUN npm ci || npm install
RUN npm run build

# --- Runtime ---
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=gobuild /out/api /app/api
COPY --from=gobuild /out/worker /app/worker
COPY backend/migrations /app/migrations
COPY --from=webbuild /web/dist /app/web/dist
ENV PORT=8080
EXPOSE 8080
CMD ["/app/api"]
