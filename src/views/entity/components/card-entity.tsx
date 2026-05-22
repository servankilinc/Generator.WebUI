import { BadgeDanger, BadgeSuccess } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import type Entity from '@/models/entity/entity';
import DialogUpdateEntity from './dialog-update-entity';
import { Separator } from '@/components/ui/separator';
import TableFields from './table-fields';

export default function CardEntity({ entity }: { entity: Entity }) {
  return (
    <Card size='sm' className='mx-auto w-full '>
      <CardHeader>
        <CardTitle>{entity.name}</CardTitle>
        <CardDescription>{entity.tableName}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className='max-w-sm'>
          <Field orientation='horizontal'>
            <span className='font-light'>Table Name</span>
            <span className='font-medium'>{entity.tableName}</span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Create Model</span>
            <span className='font-medium'>
              {entity.createDtoId != null ? <BadgeSuccess>{entity.createDto?.name ?? 'OK'}</BadgeSuccess> : <BadgeDanger>NO</BadgeDanger>}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Update Model</span>
            <span className='font-medium'>
              {entity.updateDtoId != null ? <BadgeSuccess>{entity.updateDto?.name ?? 'OK'}</BadgeSuccess> : <BadgeDanger>NO</BadgeDanger>}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Delete Model</span>
            <span className='font-medium'>
              {entity.deleteDtoId != null ? <BadgeSuccess>{entity.deleteDto?.name ?? 'OK'}</BadgeSuccess> : <BadgeDanger>NO</BadgeDanger>}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Base Model</span>
            <span className='font-medium'>
              {entity.basicResponseDtoId != null ? (
                <BadgeSuccess>{entity.basicResponseDto?.name ?? 'OK'}</BadgeSuccess>
              ) : (
                <BadgeDanger>NO</BadgeDanger>
              )}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Detail Model</span>
            <span className='font-medium'>
              {entity.detailResponseDtoId != null ? (
                <BadgeSuccess>{entity.detailResponseDto?.name ?? 'OK'}</BadgeSuccess>
              ) : (
                <BadgeDanger>NO</BadgeDanger>
              )}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <span className='font-light'>Report Model</span>
            <span className='font-medium'>
              {entity.reportDtoId != null ? <BadgeSuccess>{entity.reportDto?.name ?? 'OK'}</BadgeSuccess> : <BadgeDanger>NO</BadgeDanger>}
            </span>
          </Field>
          <Field orientation='horizontal'>
            <Checkbox checked={entity.auditable} name='terms-checkbox' disabled />
            <FieldLabel>Auditable</FieldLabel>
          </Field>
          <Field orientation='horizontal'>
            <Checkbox checked={entity.archivable} name='terms-checkbox' disabled />
            <FieldLabel>Archivable</FieldLabel>
          </Field>
          <Field orientation='horizontal'>
            <Checkbox checked={entity.softDeletable} name='terms-checkbox' disabled />
            <FieldLabel>Soft Delete</FieldLabel>
          </Field>
        </FieldGroup>

        <Separator />

        <TableFields entityId={entity.id} />
      </CardContent>
      <CardFooter>
        <DialogUpdateEntity entityId={entity.id} />
      </CardFooter>
    </Card>
  );
}
