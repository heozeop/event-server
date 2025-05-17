import { Transform } from "class-transformer";

export function BooleanTransformer() {
  return Transform(({ obj, key }) => {
    return obj[key] === true || obj[key] === 'true' || obj[key] === '1';
  });
}
