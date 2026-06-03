import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import axiosHelper from '@/lib/axios-helper';
import { Pen, SaveIcon } from 'lucide-react';
import { useAppDispatch } from '@/hooks';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type Dto from '@/models/dto/dto';
import type _Field from '@/models/field/field';
import type EntityUpdateDto from '@/models/entity/entityUpdateDto';
import { EntityUpdateSchema } from '@/models/entity/entityUpdateDto';
import { CrudTypeEnums } from '@/models/enums/enums';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';

export default function DialogUpdateEntity({ ...props }: { entityId: number }) {
  const dispatch = useAppDispatch();

  const [entity, setEntity] = useState<EntityUpdateDto>();
  const [dtos, setDtos] = useState<Dto[]>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEntity();
      fetchDtos();
    }
  }, [isOpen]);

  const fetchEntity = async () => {
    try {
      let response = await axiosHelper.get<EntityUpdateDto>('/entity/updateModel', { params: { entityId: props.entityId } });
      setEntity(response);
    } catch (error) {
      toast.error('Entity Could not Readed!');
    }
  };

  const fetchDtos = async () => {
    try {
      let response = await axiosHelper.get<Dto[]>('/dto/list/byEntity', { params: { entityId: props.entityId } });
      setDtos(response);
    } catch (error) {
      toast.error('Dtos Could not Readed!');
    }
  };

  type FormData = z.infer<typeof EntityUpdateSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(EntityUpdateSchema),
    values: entity
  });

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.put('/entity', data);
      toast.success('Entity Updated Successfuly');
      dispatch(fetchEntities());
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Entity Could not Bee Updated!');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='bg-amber-600' size='sm'>
          <Pen className='size-4 mr-2' /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Edit {entity?.name}</DialogTitle>
        </DialogHeader>
        
        <Separator/>

        <form id='form-update-entity' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FieldGroup>
            {/* Entity Name */}
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='txt-entity-name'>Name</FieldLabel>
                  <Input {...field} id='txt-entity-name' aria-invalid={fieldState.invalid} placeholder='name' autoComplete='off' />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* Table Name */}
            <Controller
              name='tableName'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='txt-table-name'>Table Name</FieldLabel>
                  <Input {...field} id='txt-table-name' aria-invalid={fieldState.invalid} placeholder='table name' autoComplete='off' />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {/* Auditable */}
            <Controller
              name='auditable'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation='horizontal'>
                  <Checkbox id='chbx-auditable' checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                  <FieldLabel htmlFor='chbx-auditable' className='font-normal'>
                    Auditable
                  </FieldLabel>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* Archivable */}
            <Controller
              name='archivable'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation='horizontal'>
                  <Checkbox id='chbx-archivable' checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                  <FieldLabel htmlFor='chbx-archivable' className='font-normal'>
                    Archivable
                  </FieldLabel>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* Soft Deletable */}
            <Controller
              name='softDeletable'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation='horizontal'>
                  <Checkbox id='chbx-softdeletable' checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                  <FieldLabel htmlFor='chbx-softdeletable' className='font-normal'>
                    Soft Deletable
                  </FieldLabel>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {/* CreateDto */}
            <Controller
              name='createDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-create-dto'>Create DTO</FieldLabel>
                  <Combobox
                    id='cmbx-create-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Create)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* updateDtoId */}
            <Controller
              name='updateDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-update-dto'>Update DTO</FieldLabel>
                  <Combobox
                    id='cmbx-update-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Update)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* deleteDtoId */}
            <Controller
              name='deleteDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-delete-dto'>Delete DTO</FieldLabel>
                  <Combobox
                    id='cmbx-delete-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Delete)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* reportDtoId */}
            <Controller
              name='reportDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-report-dto'>Report DTO</FieldLabel>
                  <Combobox
                    id='cmbx-report-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Read)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* basicResponseDtoId */}
            <Controller
              name='basicResponseDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-basic-response-dto'>Basic Response DTO</FieldLabel>
                  <Combobox
                    id='cmbx-basic-response-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Read)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {/* detailResponseDtoId */}
            <Controller
              name='detailResponseDtoId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-detail-response-dto'>Detail Response DTO</FieldLabel>
                  <Combobox
                    id='cmbx-detail-response-dto'
                    items={dtos?.filter(f => f.crudTypeId == CrudTypeEnums.Read)}
                    value={dtos?.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = dtos?.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a field type' />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.name}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button type='submit' form='form-update-entity' className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            <SaveIcon className='mr-1 mb-0.5 self-center' />
              Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
