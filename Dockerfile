FROM node
WORKDIR /app
COPY . /app/
RUN apt-get update -y && apt-get install cron -y \
    && npm install -y
COPY configs/start_local.sh /app/start_local.sh
RUN chmod +x /app/start_local.sh
ENTRYPOINT [ "bash", "-c", "/app/start_local" ]
