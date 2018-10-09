FROM node:alpine AS assetbuilder
WORKDIR /app
COPY package*.json ./
COPY gulpfile.js ./
COPY assets/ ./assets/
RUN npm install && NODE_ENV=production npx gulp

FROM golang:latest AS binarybuilder
WORKDIR /go/src/github.com/driv3r/fathom
COPY . /go/src/github.com/driv3r/fathom
COPY --from=assetbuilder /app/assets/build ./assets/build
RUN go get -u github.com/gobuffalo/packr/... && make docker

FROM alpine:latest
EXPOSE 8080
HEALTHCHECK --retries=10 CMD ["wget", "-qO-", "http://localhost:8080/health"]
RUN apk add --update --no-cache bash ca-certificates
WORKDIR /app
COPY --from=binarybuilder /go/src/github.com/driv3r/fathom/fathom .
CMD ["./fathom", "server"]
