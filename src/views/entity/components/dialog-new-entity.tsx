import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import axiosHelper from '@/lib/axios-helper';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { useAppDispatch } from '@/hooks';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { PlusCircleIcon, TrashIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import type FieldType from '@/models/fieldType/fieldType';
import type FieldCreateDto from '@/models/field/fieldCreateDto';
import type EntityCreateDto from '@/models/entity/entityCreateDto';
import { EntityCreateSchema } from '@/models/entity/entityCreateDto';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

type FormData = z.infer<typeof EntityCreateSchema>;

export default function DialogNewEntity() {
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);

  useEffect(() => {
    fetchBaseFieldTypes();
  }, []);

  const fetchBaseFieldTypes = async () => {
    try {
      let response = await axiosHelper.get<FieldType[]>('/fieldType/list/onbasetype');
      setFieldTypes(response ?? []);
    } catch (error) {
      toast.error('Field Types Could not Readed!');
    }
  };

  const createModel: EntityCreateDto = {
    name: '',
    tableName: '',
    softDeletable: true,
    auditable: true,
    archivable: false,
    fields: [
      {
        fieldTypeId: 1,
        name: 'Field',
        isRequired: true,
        isUnique: false,
        isList: false,
        filterable: false
      }
    ] as FieldCreateDto[]
  };

  const form = useForm<FormData>({
    resolver: zodResolver(EntityCreateSchema),
    defaultValues: createModel
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields'
  });

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.post('entity', data);
      toast.success('Entity Created Successfuly');
      setIsOpen(false);
      form.reset();
      dispatch(fetchEntities());
    } catch (error) {
      toast.error('Entity Could not Bee Created!');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant='destructive' className='w-min m-3'>
          <PlusCircleIcon className='mx-2' /> New Entity
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Create New Entity</DialogTitle>
          <DialogDescription>Create entity and define fields.</DialogDescription>
        </DialogHeader>
        <form id='form-create-entity' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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

          <Separator />
          {/* Fields */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Fields</h3>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  append({
                    fieldTypeId: 1,
                    name: '',
                    isRequired: false,
                    isUnique: false,
                    isList: false,
                    filterable: false
                  })
                }>
                <PlusCircleIcon className='mr-3' />
                Add Field
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[100px]'>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Filterable</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((item, index) => (
                  <TableRow key={item.name}>
                    <TableCell className='font-medium'>
                      {/* Field Name */}
                      <Controller
                        name={`fields.${index}.name`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input {...field} aria-invalid={fieldState.invalid} placeholder='field name' autoComplete='off' />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      {/* Field Type */}
                      <Controller
                        name={`fields.${index}.fieldTypeId`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Combobox
                              items={fieldTypes}
                              value={fieldTypes.find(x => x.id === field.value)?.name ?? ''}
                              onValueChange={value => {
                                const selected = fieldTypes.find(x => x.name === value);
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
                    </TableCell>
                    <TableCell className='font-medium'>
                      {/* List */}
                      <Controller
                        name={`fields.${index}.isList`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Unique */}
                      <Controller
                        name={`fields.${index}.isUnique`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Required */}
                      <Controller
                        name={`fields.${index}.isRequired`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Filterable */}
                      <Controller
                        name={`fields.${index}.filterable`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button type='button' variant='destructive' onClick={() => remove(index)}>
                        <TrashIcon color='red' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button type='submit' form='form-create-entity'>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
