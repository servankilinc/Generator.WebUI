import z from 'zod';
import type DtoFieldUpdateDto from '../dtoField/dtoFieldUpdateDto';
import { DtoFieldUpdateSchema } from '../dtoField/dtoFieldUpdateDto';

export default interface DtoUpdateDto {
  id: number;
  name: string;
  relatedEntityId: number;
  crudTypeId: number;
  dtoFields?: DtoFieldUpdateDto[] | null;
}

export const DtoUpdateSchema = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  relatedEntityId: z.number(),
  crudTypeId: z.number(),
  dtoFields: z.array(DtoFieldUpdateSchema).nullish()
});
