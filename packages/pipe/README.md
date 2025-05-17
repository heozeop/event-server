# @libs/pipe

A collection of reusable NestJS pipes for validation and transformation.

## ValidationPipe

Enhanced validation pipe with better error handling and logging.

## Usage

```typescript
// In your module
import { PipeModule } from '@libs/pipe';

@Module({
  imports: [
    PipeModule,
    // ...
  ],
})
export class AppModule {}

// In main.ts
import { ValidationPipe } from '@libs/pipe';

// Using globally
app.useGlobalPipes(app.get(ValidationPipe));
``` 
