# Fluentd Integration Guide

This guide explains how to implement the Fluentd-based log collection system as specified in the log-plan.md document.

## Overview

The implemented solution follows the side-car pattern with:
1. Pino logger with file transport in each service
2. Fluentd containers as sidecars to collect and process logs
3. Structured log storage following the specified directory format

## Implementation Steps

### 1. Setup Log Directories

Run the setup script to create the log directories:

```bash
# Create necessary directories
chmod +x scripts/setup-logs.sh
./scripts/setup-logs.sh
```

This creates the following structure:
```
logs/
  ├── gateway/
  ├── auth/
  ├── event/
  ├── system/
  │   ├── gateway/
  │   ├── auth/
  │   └── event/
  └── docker/
      ├── gateway/
      ├── auth/
      └── event/
```

### 2. Configure Services

Each NestJS service should be configured to use the logger with file transport:

```typescript
LoggerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    serviceName: 'your-service-name',
    prettyPrint: configService.get('NODE_ENV') !== 'production',
    logLevel: configService.get('LOG_LEVEL') || 'info',
    fileTransport: {
      enabled: true,
      destination: '/logs/your-service-name/your-service-name.log',
      mkdir: true
    },
  }),
}),
```

### 3. Build and Run with Fluentd Sidecars

The docker-compose.yml file is already configured with Fluentd sidecars for each service:

```bash
# Build and start all services with Fluentd sidecars
docker-compose up -d
```

### 4. Monitoring Logs

You can monitor the log collection process using the provided scripts:

```bash
# Check if log files are being created
./scripts/check-logs.sh

# Inspect the content of a specific log file
./scripts/inspect-log.sh gateway-fluentd service.gateway 10

# Check Fluentd container status and configuration
./scripts/check-fluentd-status.sh
```

You can also check logs directly:

```bash
# Check logs from Fluentd sidecars
docker-compose logs gateway-fluentd
docker-compose logs auth-fluentd
docker-compose logs event-fluentd

# Check the collected logs
ls -la logs/gateway/
ls -la logs/auth/
ls -la logs/event/
```

### 5. Fluentd Configuration Details

The Fluentd configuration handles:

1. **Input Sources**: 
   * Application logs from /logs directory
   ```
   <source>
     @type tail
     path /logs/gateway.log
     pos_file /fluentd/log/gateway.pos
     tag gateway
     <parse>
       @type json
     </parse>
   </source>
   ```
   
   * Docker container logs
   ```
   <source>
     @type tail
     path /var/lib/docker/containers/*/*-json.log
     pos_file /fluentd/log/docker.pos
     tag docker
     <parse>
       @type json
     </parse>
   </source>
   ```

2. **Output**: Storing logs in the specified directory structure
   ```
   <match gateway>
     @type file
     path /fluentd/log/app/gateway/gateway
     append true
     <format>
       @type json
     </format>
     <buffer>
       @type file
       flush_mode interval
       flush_interval 1s
       flush_thread_count 4
       chunk_limit_size 256m
     </buffer>
   </match>
   
   <match docker>
     @type file
     path /fluentd/log/docker/docker
     append true
     <format>
       @type json
     </format>
     <buffer>
       @type file
       flush_mode interval
       flush_interval 1s
       flush_thread_count 4
       chunk_limit_size 256m
     </buffer>
   </match>
   ```

### 6. Customizing the Configuration

To customize the Fluentd configuration:

1. Edit the `config/fluentd/fluent.conf` file
2. Rebuild and restart the Fluentd containers:
   ```
   ./scripts/restart-fluentd.sh
   ```

## Validation

To verify the log collection setup:

1. Generate logs by using the services
2. Check that application logs are being written to the file system:
   ```
   cat logs/gateway/gateway.log
   ```
3. Verify that Fluentd is processing and storing the different types of logs:
   ```
   # Check application logs
   docker exec gateway-fluentd ls -la /fluentd/log/app/gateway/
   
   # Check Docker logs
   docker exec gateway-fluentd ls -la /fluentd/log/docker/
   ```
4. Monitor Fluentd performance:
   ```
   curl http://localhost:24221/api/plugins.json
   ```
5. Use the provided scripts for more detailed inspection:
   ```
   # Check if log files are being created
   ./scripts/check-logs.sh
   
   # Inspect specific log contents
   ./scripts/inspect-log.sh gateway-fluentd service.gateway 10
   ./scripts/inspect-log.sh auth-fluentd system 20
   ./scripts/inspect-log.sh event-fluentd docker 5
   ```

## Troubleshooting

If logs are not being collected:

1. Check service logs:
   ```
   docker-compose logs gateway
   ```
2. Check Fluentd logs:
   ```
   docker-compose logs gateway-fluentd
   ```
3. Verify file permissions:
   ```
   ls -la logs/
   ls -la logs/system/
   ls -la logs/docker/
   ```
4. Check Fluentd configuration:
   ```
   docker exec gateway-fluentd cat /fluentd/etc/fluent.conf
   ```
5. Check if system logs are accessible:
   ```
   docker exec gateway-fluentd ls -la /var/log/
   docker exec gateway-fluentd cat /var/log/syslog | head
   ```
6. Check if Docker logs are accessible:
   ```
   docker exec gateway-fluentd ls -la /var/lib/docker/containers/
   ```
7. Use the status checking script for a quick overview:
   ```
   ./scripts/check-fluentd-status.sh
   ```
