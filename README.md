# Event Rewards Platform

A microservices-based application for managing events and rewards using NestJS.

## Architecture

This platform consists of three main services:

1. **Gateway Service**: Acts as the API Gateway and handles HTTP requests from clients
2. **Auth Service**: Handles authentication and user management
3. **Event Service**: Manages events and rewards

## Development Setup

### Prerequisites

- Node.js (v18+)
- pnpm
- Docker and Docker Compose

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd event-server
pnpm install
```

### Running the Application

Use the provided script to start all services in Docker:

```bash
./rebuild-and-start.sh
```

This will:
- Build and start all services
- Start MongoDB instances for each service
- Configure the network

## API Documentation

Swagger documentation is available at:

```
http://localhost:3333/docs
```

The Swagger UI provides:
- Interactive API documentation
- Ability to test all endpoints
- Authentication using JWT tokens

## Logging System

The application uses structured JSON logging with Grafana Loki and Grafana Alloy for centralized log management. Features include:

- **JSON Format**: All logs are in JSON format for easy parsing and analysis
- **Request Tracing**: Each log includes a requestId to trace requests across services
- **Centralized Logging**: All logs are collected by Grafana Alloy and stored in Loki
- **Dashboards**: Pre-configured Grafana dashboards for log analysis
- **Performance Tracking**: The `@LogPerformance()` decorator can be used to track method execution time
- **Sensitive Data Redaction**: Sensitive information like passwords and tokens are automatically redacted
- **Log Levels**: Different log levels based on environment (debug in development, info in production)
- **Pretty Printing**: Development logs can be formatted for readability

### Viewing Logs

Grafana is available at `http://localhost:3000` with default credentials `admin/admin`.

Pre-configured dashboards include:
- Request Tracing Dashboard: Shows logs grouped by requestId for tracing requests across services
- Log Viewer: General log viewer with filtering capabilities

### Example Loki Queries

- All logs: `{container=~".+"}`
- Logs from a specific service: `{container="gateway"}`
- Tracing a specific request: `{requestId="specific-request-id"}`
- Error logs: `{container=~".+"} |= "error"`

### Logging API Usage

```typescript
import { LogPerformance } from './common/logging';

@Controller()
export class MyController {
  constructor(private readonly logger: LoggerService) {}

  @Get('resource')
  @LogPerformance('category')
  async getResource() {
    // Method execution time will be logged
    this.logger.log('Getting resource', { resourceId: '123' });
    return this.service.fetchResource();
  }
}
```

## Services

### Gateway Service
- Microservice Port: 3010 (mapped to internal port 3000)
- HTTP Port: 3333 (for REST API and Swagger)

### Auth Service
- Microservice Port: 3001

### Event Service
- Microservice Port: 3002

## Database

Each service has its own MongoDB instance:

- Auth Service: mongodb://mongo-user:27017/user-db
- Event Service: mongodb://mongo-event:27017/event-db

## Useful Commands

- Start all services: `./rebuild-and-start.sh`
- View logs: `docker compose logs -f`
- Stop all services: `docker compose down` 
