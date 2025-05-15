import { AnyEntity, EntityClass, Options } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Test module that provides a MikroORM instance with mongodb-memory-server
 */
export class MongoMemoryOrmModule {
  private mongod: MongoMemoryServer;
  private databaseName: string;

  /**
   * Initialize the test database
   */
  async init(databaseName: string): Promise<void> {
    this.databaseName = databaseName;

    this.mongod = new MongoMemoryServer({
      instance: {
        dbName: this.databaseName,
      },
    });
    await this.mongod.start();
    console.log(this.mongod.getUri());
  }

  /**
   * Get MikroORM module configuration for testing
   */
  getMikroOrmModule(entities: EntityClass<AnyEntity>[]) {
    const options: Options = {
      driver: MongoDriver,
      clientUrl: `${this.mongod.getUri()}${this.databaseName}`,
      entities,
      schemaGenerator: {
        disableForeignKeys: true,
        createForeignKeyConstraints: false,
      },
      discovery: {
        warnWhenNoEntities: true,
        requireEntitiesArray: false,
        alwaysAnalyseProperties: true,
        disableDynamicFileAccess: false,
      },
      // Drop tables when initializing
      allowGlobalContext: true,
      forceUndefined: true,
      debug: false,
    };

    return MikroOrmModule.forRoot(options);
  }

  /**
   * Get MikroORM feature module for testing
   */
  getMikroOrmFeatureModule(entities: EntityClass<AnyEntity>[]) {
    return MikroOrmModule.forFeature(entities);
  }

  /**
   * Stop the test database
   */
  async stop(): Promise<void> {
    if (this.mongod) {
      await this.mongod.stop();
    }
  }
}
