FROM node:latest
WORKDIR /usr/app
COPY . /usr/app
CMD ["node", "npm", "yarn"]

