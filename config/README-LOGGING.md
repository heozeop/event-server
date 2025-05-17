# Logging System Configuration

This project uses Grafana Alloy, Loki, and Grafana to collect, store, and visualize logs. The primary focus is on tracking request flows across microservices using correlated request IDs.

## Components

- **Grafana Alloy**: Collects and forwards logs from Docker containers to Loki
- **Loki**: Log aggregation system that stores logs
- **Grafana**: Visualization platform with dashboards for log analysis

## Architecture

```
┌─────────────┐          ┌─────────────┐         ┌─────────────┐
│  NestJS     │          │  Grafana    │         │  Grafana    │
│  Services   │──logs────▶   Alloy     │─────────▶   Loki      │
└─────────────┘          └─────────────┘         └──────┬──────┘
                                                        │
                                                        │
                                                 ┌──────▼──────┐
                                                 │  Grafana    │
                                                 │  Dashboards │
                                                 └─────────────┘
```

## Key Features

1. **JSON-structured Logging**: All logs are in JSON format, making them easy to parse and analyze
2. **Request Tracing**: RequestID is automatically added to logs for tracing requests across services
3. **Centralized Management**: All logs are collected in one place
4. **Real-time Visualization**: Grafana dashboards provide real-time insight into application behavior

## Dashboards

1. **Request Tracing Dashboard**: Shows logs grouped by requestId, allowing you to trace requests across services
2. **Log Viewer**: General log viewer with filtering capabilities

## Usage

### Starting the Logging Infrastructure

Use the provided script:

```bash
./start-logging.sh
```

This starts Loki, Grafana, Alloy, and the application services.

### Accessing Grafana

- URL: http://localhost:3000
- Default credentials: admin/admin

### Useful Loki Queries

- All logs: `{container=~".+"}`
- Logs from a specific service: `{container="gateway"}`
- Tracing a specific request: `{requestId="specific-request-id"}`
- Error logs: `{container=~".+"} |= "error"`

### Testing the Logging System

Run the test script to generate sample logs with correlated request IDs:

```bash
./scripts/test-logging.js
```

## Log Context in NestJS Services

The logging system automatically captures:

- requestId
- serviceId
- path
- method
- statusCode
- error information (when applicable)
- user context (when authenticated)

## Configuring the Logger

The logger is configured to:

1. Output JSON logs that Grafana Alloy can parse
2. Include request context in all logs
3. Mask sensitive information

## Troubleshooting

If logs are not appearing in Grafana:

1. Check if Loki is running: `docker ps | grep loki`
2. Check if Alloy is running: `docker ps | grep alloy`
3. Verify Alloy configuration in `config/alloy/config.yaml`
4. Check Grafana data source configuration
5. Try to query logs directly from Loki API: `curl http://localhost:3100/loki/api/v1/query?query={container=~".+"}`
