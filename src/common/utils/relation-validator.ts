import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

export function validateRelations<T extends ObjectLiteral>(
  repository: Repository<T>,
  relations?: string[],
): void {
  if (!relations || relations.length === 0) {
    return;
  }

  const allowedRelations = repository.metadata.relations.map(
    (relation) => relation.propertyName,
  );

  for (const relation of relations) {
    if (!allowedRelations.includes(relation)) {
      throw new BadRequestException(
        `Invalid relation "${relation}". Available relations: [${allowedRelations.join(', ')}]`,
      );
    }
  }
}
