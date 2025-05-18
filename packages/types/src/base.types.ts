import { ObjectId } from "@mikro-orm/mongodb";

export interface CustomBaseEntity {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
