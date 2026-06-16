import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import axiosHelper from '@/lib/axios-helper';
import { Pen, SaveIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type CrudType from '@/models/crudType/crudType';
import type DtoUpdateDto from '@/models/dto/dtoUpdateDto';
import { DtoUpdateSchema } from '@/models/dto/dtoUpdateDto';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';

type FormData = z.infer<typeof DtoUpdateSchema>;

export default function DialogUpdateDto({ dtoId, onUpdated }: { dtoId: number; onUpdated?: () => void }) {
  const dispatch = useAppDispatch();
  const entities = useAppSelector(state => state.entity.entities);

  const [dto, setDto] = useState<DtoUpdateDto>();
  const [crudTypes, setCrudTypes] = useState<CrudType[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(DtoUpdateSchema),
    values: dto
  });

  async function fetchDto() {
    try {
      const response = await axiosHelper.get<DtoUpdateDto>('/dto/updateModel', { params: { dtoId } });
      setDto(response);
    } catch {
      toast.error('Dto Could not Readed!');
    }
  }

  async function fetchCrudTypes() {
    try {
      const response = await axiosHelper.get<CrudType[]>('/crudType/list');
      setCrudTypes(response ?? []);
    } catch {
      toast.error('Crud Types Could not Readed!');
    }
  }

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDto();
      fetchCrudTypes();
      if (entities.length === 0) {
        dispatch(fetchEntities());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, dtoId, entities.length, isOpen]);

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.put('/dto', data);
      toast.success('DTO updated successfully');
      setIsOpen(false);
      form.reset();
      onUpdated?.();
    } catch {
      toast.error('DTO could not be updated!');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Pen className='size-4' /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Edit {dto?.name ?? 'DTO'}</DialogTitle>
        </DialogHeader>

        <Separator />

        <form id='form-update-dto' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FieldGroup>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='txt-dto-name'>Name</FieldLabel>
                  <Input {...field} id='txt-dto-name' aria-invalid={fieldState.invalid} placeholder='name' autoComplete='off' />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='relatedEntityId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-related-entity'>Related Entity</FieldLabel>
                  <Combobox
                    id='cmbx-related-entity'
                    items={entities}
                    value={entities.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = entities.find(x => x.name === value);
                      field.onChange(selected?.id ?? 0);
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select an entity' />
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

            <Controller
              name='crudTypeId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cmbx-crud-type'>CRUD Type</FieldLabel>
                  <Combobox
                    id='cmbx-crud-type'
                    items={crudTypes}
                    value={crudTypes.find(x => x.id === field.value)?.name ?? ''}
                    onValueChange={value => {
                      const selected = crudTypes.find(x => x.name === value);
                      if (selected) {
                        field.onChange(selected.id);
                      }
                    }}
                    aria-invalid={fieldState.invalid}>
                    <ComboboxInput placeholder='Select a CRUD type' />
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
          <Button type='submit' form='form-update-dto' className='gap-1'>
            <SaveIcon className='size-4' />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
