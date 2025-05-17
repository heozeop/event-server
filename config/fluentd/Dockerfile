FROM fluent/fluentd:v1.16-1

# Use root account to use apk
USER root

# Install dependencies for plugins
RUN apk add --no-cache --update \
    build-base \
    ruby-dev \
    && rm -rf /var/cache/apk/*

# Install Fluentd plugins
RUN gem install \
    fluent-plugin-elasticsearch \
    fluent-plugin-record-reformer \
    fluent-plugin-record-modifier \
    fluent-plugin-rewrite-tag-filter \
    fluent-plugin-s3 \
    fluent-plugin-systemd

# Create directories for logs
RUN mkdir -p /logs \
    && mkdir -p /fluentd/log \
    && mkdir -p /fluentd/log/system \
    && mkdir -p /fluentd/log/docker \
    && mkdir -p /fluentd/log/gateway \
    && mkdir -p /fluentd/log/auth \
    && mkdir -p /fluentd/log/event \
    && mkdir -p /fluentd/log/nestjs/gateway \
    && mkdir -p /fluentd/log/nestjs/auth \
    && mkdir -p /fluentd/log/nestjs/event \
    && mkdir -p /fluentd/log/unmatched \
    && mkdir -p /fluentd/log/pos \
    && chmod -R 777 /logs \
    && chmod -R 777 /fluentd/log

# Copy the Fluentd configuration file
COPY fluent.conf /fluentd/etc/fluent.conf

# Run Fluentd as root to avoid permission issues
# USER fluent

EXPOSE 24220 24224 
