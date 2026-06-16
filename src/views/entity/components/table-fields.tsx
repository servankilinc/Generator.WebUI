import { useEffect, useState } from 'react';
import { PlusCircleIcon, SaveIcon, TrashIcon } from 'lucide-react';
import axiosHelper from '@/lib/axios-helper';
import { toast } from 'sonner';
import z from 'zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type FieldType from '@/models/fieldType/fieldType';
import type _Field from '@/models/field/field';
import { FieldsUpdateSchema } from '@/models/field/fieldUpdateDto';
import type FieldUpdateDto from '@/models/field/fieldUpdateDto';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';

export default function TableFields(props: { entityId: number }) {
  const [fieldList, setFieldsList] = useState<FieldUpdateDto[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [formChanged, setFormChanged] = useState(false);

  useEffect(() => {
    fetchBaseFieldTypes();
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await axiosHelper.get<FieldUpdateDto[]>('/field/list/updateModel', { params: { entityId: props.entityId } });
      setFieldsList(response ?? []);
    } catch (error) {
      toast.error('Fields Could not Readed!');
    }
  };

  const fetchBaseFieldTypes = async () => {
    try {
      const response = await axiosHelper.get<FieldType[]>('/fieldType/list/onbasetype', { params: { entityId: props.entityId } });
      setFieldTypes(response ?? []);
    } catch (error) {
      toast.error('Field Types Could not Readed!');
    }
  };

  type FormData = z.infer<typeof FieldsUpdateSchema>;
  const form = useForm<FormData>({
    resolver: zodResolver(FieldsUpdateSchema),
    values: {
      fields: fieldList
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields'
  });

  const handleAppend = () => {
    append({
      id: 0,
      fieldTypeId: 1,
      name: '',
      isRequired: false,
      isUnique: false,
      isList: false,
      filterable: false
    });
    setFormChanged(true);
  };

  const handleRemove = (index: number) => {
    remove(index);
    setFormChanged(true);
  };

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.put('/field/list', data.fields, { params: { entityId: props.entityId } });
      toast.success('Fields Updated Successfuly');
      form.reset();
      setFormChanged(false);
    } catch (error) {
      toast.error('Fields Could not Bee Updated!');
    }
  }

  return (
    <div className='space-y-4'>
      <form id='form-update-fields' onSubmit={form.handleSubmit(onSubmit)} onChange={() => setFormChanged(true)} className='space-y-6'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>List</TableHead>
              <TableHead>Unique</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Filterable</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields != null &&
              fields.map((item, index) => (
                <TableRow key={item.id + item.name}>
                  <TableCell className='font-medium'>
                    {/* Field Name */}
                    <Controller
                      name={`fields.${index}.name`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className='w-28'>
                          <Input {...field} aria-invalid={fieldState.invalid} placeholder='field name' autoComplete='off' className='w-full' />
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
                        <Field data-invalid={fieldState.invalid} className='w-28'>
                          <Combobox
                            items={fieldTypes}
                            value={fieldTypes.find(x => x.id === field.value)?.name ?? ''}
                            onValueChange={value => {
                              const selected = fieldTypes.find(x => x.name === value);
                              if (selected) {
                                setFormChanged(true);
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
                    <Button type='button' variant='destructive' onClick={() => handleRemove(index)}>
                      <TrashIcon color='red' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow >
                <TableCell colSpan={7} className='text-center text-sm text-gray-500'>
                  <Button type='button' size='sm' variant='ghost' onClick={handleAppend} className='my-1 bg-gray-700'>
                    <PlusCircleIcon className='mr-3' /> Add Field
                  </Button>
                </TableCell>
            </TableRow>
          </TableBody>
          {formChanged && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>
                  <Button type='submit' form='form-update-fields' className='mt-3 float-right bg-green-500 hover:bg-green-600 text-white'>
                    <SaveIcon /> Save Changes
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </form>
    </div>
  );
}
