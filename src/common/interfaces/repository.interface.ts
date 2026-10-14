import { DeleteResult } from 'typeorm';
import { GetAll } from './get-all.interface';

export interface IRepository<T, CreateDto, QueryDto, UpdateDto> {
  create(dto: CreateDto): Promise<T>;
  getAll(query: QueryDto): Promise<GetAll<T>>;
  getById(id: string, query: QueryDto): Promise<T>;
  update(id: string, dto: UpdateDto): Promise<T>;
  delete(id: string): Promise<DeleteResult>;
}
