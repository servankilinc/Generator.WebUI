import { useEffect, useState } from 'react';
import { PlusCircleIcon, SaveIcon, TrashIcon } from 'lucide-react';
import axiosHelper from '@/lib/axios-helper';
import { toast } from 'sonner';
import z from 'zod';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import type DtoUpdateDto from '@/models/dto/dtoUpdateDto';
import type DtoFieldUpdateDto from '@/models/dtoField/dtoFieldUpdateDto';
import { DtoFieldsUpdateSchema } from '@/models/dtoField/dtoFieldUpdateDto';
import type RelationVisualModel from '@/models/dtoFieldRelations/relationVisualModel';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import DialogValidations from './dialog-validations';

type FormData = z.infer<typeof DtoFieldsUpdateSchema>;

export default function TableDtoFields(props: { dtoId: number; onUpdated?: () => void }) {
  const dispatch = useAppDispatch();
  const entities = useAppSelector(state => state.entity.entities);

  const [relatedEntityId, setRelatedEntityId] = useState(0);
  const [dtoFieldList, setDtoFieldsList] = useState<DtoFieldUpdateDto[]>([]);
  const [relationOptionsByIndex, setRelationOptionsByIndex] = useState<Record<number, RelationVisualModel[]>>({});
  const [formChanged, setFormChanged] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(DtoFieldsUpdateSchema),
    values: {
      dtoFields: dtoFieldList
    }
  });

  const watchedDtoFields = useWatch({
    control: form.control,
    name: 'dtoFields'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dtoFields'
  });

  const getEntityFields = (sourceEntityId: number) => entities.find(entity => entity.id === sourceEntityId)?.fields ?? [];

  async function fetchDtoUpdateModel() {
    try {
      const response = await axiosHelper.get<DtoUpdateDto>('/dto/updateModel', { params: { dtoId: props.dtoId } });
      setRelatedEntityId(response?.relatedEntityId ?? 0);

      await fetchDtoFields();
    } catch {
      toast.error('Dto Could not Readed!');
    }
  }

  async function fetchDtoFields() {
    try {
      const response = await axiosHelper.get<DtoFieldUpdateDto[]>('/dtoField/list/updateModel', { params: { dtoId: props.dtoId } });
      setDtoFieldsList(response ?? []);
    } catch {
      toast.error('DTO Fields Could not Readed!');
    }
  }

  async function syncDtoFieldRelations(index: number, sourceEntityId: number, dtoRelatedEntityId: number) {
    setRelationOptionsByIndex(current => ({
      ...current,
      [index]: []
    }));
    form.setValue(`dtoFields.${index}.dtoFieldRelations`, null, { shouldValidate: true });

    if (sourceEntityId === 0 || dtoRelatedEntityId === 0 || sourceEntityId === dtoRelatedEntityId) {
      return;
    }

    try {
      const response = await axiosHelper.get<RelationVisualModel[]>('/relation/list/behindEntities', {
        params: {
          firstEntityId: dtoRelatedEntityId,
          secondEntityId: sourceEntityId
        }
      });
      const relationOptions = response ?? [];
      setRelationOptionsByIndex(current => ({
        ...current,
        [index]: relationOptions
      }));
      form.setValue(
        `dtoFields.${index}.dtoFieldRelations`,
        [
          {
            relationId: relationOptions.length === 1 ? relationOptions[0].id : 0,
            sequenceNo: 1,
            firstEntityId: dtoRelatedEntityId,
            secondEntityId: sourceEntityId
          }
        ],
        { shouldValidate: true }
      );
    } catch {
      toast.error('Relation Visual Models Could not Readed!');
    }
  }

  async function loadRelationOptions(index: number, sourceEntityId: number, dtoRelatedEntityId: number) {
    if (sourceEntityId === 0 || dtoRelatedEntityId === 0 || sourceEntityId === dtoRelatedEntityId) {
      setRelationOptionsByIndex(current => ({
        ...current,
        [index]: []
      }));
      return;
    }

    try {
      const response = await axiosHelper.get<RelationVisualModel[]>('/relation/list/behindEntities', {
        params: {
          firstEntityId: dtoRelatedEntityId,
          secondEntityId: sourceEntityId
        }
      });
      const relationOptions = response ?? [];
      setRelationOptionsByIndex(current => ({
        ...current,
        [index]: relationOptions
      }));

      const currentRelation = form.getValues(`dtoFields.${index}.dtoFieldRelations`)?.[0];
      if (relationOptions.length === 1 && currentRelation != null && currentRelation.relationId !== relationOptions[0].id) {
        form.setValue(`dtoFields.${index}.dtoFieldRelations.0.relationId`, relationOptions[0].id, { shouldValidate: true });
      }
    } catch {
      toast.error('Relation Visual Models Could not Readed!');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDtoUpdateModel();
    if (entities.length === 0) {
      dispatch(fetchEntities());
    }
  }, [dispatch, entities.length, props.dtoId]);

  useEffect(() => {
    watchedDtoFields?.forEach((dtoField, index) => {
      loadRelationOptions(index, dtoField.sourceEntityId, relatedEntityId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtoFieldList, relatedEntityId]);

  const handleAppend = () => {
    append({
      id: 0,
      sourceEntityId: 0,
      sourceFieldId: 0,
      name: '',
      isRequired: false,
      isList: false,
      dtoFieldRelations: null
    });
    setFormChanged(true);
  };

  const handleRemove = (index: number) => {
    remove(index);
    setRelationOptionsByIndex(current => {
      const next: Record<number, RelationVisualModel[]> = {};
      Object.entries(current).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) {
          next[numericKey] = value;
        } else if (numericKey > index) {
          next[numericKey - 1] = value;
        }
      });
      return next;
    });
    setFormChanged(true);
  };

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.put('/dtoFields/list', data.dtoFields, { params: { dtoId: props.dtoId } });
      toast.success('DTO Fields Updated Successfuly');
      setDtoFieldsList(data.dtoFields.map(dtoField => ({ ...dtoField, dtoFieldRelations: dtoField.dtoFieldRelations ?? null })));
      form.reset(data);
      setFormChanged(false);
      props.onUpdated?.();
    } catch {
      toast.error('DTO Fields Could not Bee Updated!');
    }
  }

  return (
    <div className='space-y-4'>
      <form id={`form-update-dto-fields-${props.dtoId}`} onSubmit={form.handleSubmit(onSubmit)} onChange={() => setFormChanged(true)} className='space-y-6'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Entity</TableHead>
              <TableHead>Source Field</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>List</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Rel. Sequence</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => {
              const sourceEntityId = watchedDtoFields?.[index]?.sourceEntityId ?? 0;
              const sourceEntityFields = getEntityFields(sourceEntityId);
              const relationOptions = relationOptionsByIndex[index] ?? [];
              const hasRelation = sourceEntityId !== 0 && relatedEntityId !== 0 && sourceEntityId !== relatedEntityId;

              return (
                <TableRow key={item.id}>

                  <TableCell className='font-medium'>
                    <Controller
                      name={`dtoFields.${index}.sourceEntityId`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className='w-32'>
                          <Combobox
                            items={entities}
                            value={entities.find(x => x.id === field.value)?.name ?? ''}
                            onValueChange={value => {
                              const selected = entities.find(x => x.name === value);
                              const selectedEntityId = selected?.id ?? 0;
                              setFormChanged(true);
                              field.onChange(selectedEntityId);
                              form.setValue(`dtoFields.${index}.sourceFieldId`, 0, { shouldValidate: true });
                              form.setValue(`dtoFields.${index}.name`, '', { shouldValidate: true });
                              form.setValue(`dtoFields.${index}.isRequired`, false);
                              form.setValue(`dtoFields.${index}.isList`, false);
                              syncDtoFieldRelations(index, selectedEntityId, relatedEntityId);
                            }}
                            aria-invalid={fieldState.invalid}>
                            <ComboboxInput placeholder='Select an entity' />
                            <ComboboxContent>
                              <ComboboxEmpty>No items found.</ComboboxEmpty>
                              <ComboboxList>
                                {entity => (
                                  <ComboboxItem key={entity.id} value={entity.name}>
                                    {entity.name}
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
                    <Controller
                      name={`dtoFields.${index}.sourceFieldId`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className='w-32'>
                          <Combobox
                            items={sourceEntityFields}
                            value={sourceEntityFields.find(x => x.id === field.value)?.name ?? ''}
                            onValueChange={value => {
                              const selected = sourceEntityFields.find(x => x.name === value);
                              if (selected) {
                                setFormChanged(true);
                                field.onChange(selected.id);
                                form.setValue(`dtoFields.${index}.name`, selected.name, { shouldValidate: true });
                                form.setValue(`dtoFields.${index}.isRequired`, selected.isRequired);
                                form.setValue(`dtoFields.${index}.isList`, selected.isList);
                              }
                            }}
                            aria-invalid={fieldState.invalid}>
                            <ComboboxInput disabled={sourceEntityId === 0} placeholder='Select a source field' />
                            <ComboboxContent>
                              <ComboboxEmpty>No items found.</ComboboxEmpty>
                              <ComboboxList>
                                {field => (
                                  <ComboboxItem key={field.id} value={field.name}>
                                    {field.name}
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
                    <Controller
                      name={`dtoFields.${index}.name`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className='w-28'>
                          <Input {...field} aria-invalid={fieldState.invalid} placeholder='field name' autoComplete='off' className='w-full' />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </TableCell>
                                    <TableCell>
                    <Controller
                      name={`dtoFields.${index}.isRequired`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </TableCell>
                  <TableCell className='font-medium'>
                    <Controller
                      name={`dtoFields.${index}.isList`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} orientation='horizontal' className='justify-center'>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-invalid={fieldState.invalid} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </TableCell>

                  
                  <TableCell className='font-medium'>
                    {hasRelation ? (
                      <Controller
                        name={`dtoFields.${index}.dtoFieldRelations.0.relationId`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} className='w-32'>
                            <Combobox
                              items={relationOptions}
                              value={relationOptions.find(x => x.id === field.value)?.name ?? ''}
                              onValueChange={value => {
                                const selected = relationOptions.find(x => x.name === value);
                                if (selected) {
                                  setFormChanged(true);
                                  field.onChange(selected.id);
                                }
                              }}
                              aria-invalid={fieldState.invalid}>
                              <ComboboxInput placeholder='Select relation' />
                              <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                  {relation => (
                                    <ComboboxItem key={relation.id} value={relation.name}>
                                      {relation.name}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className='font-medium'>
                    {hasRelation ? (
                      <Controller
                        name={`dtoFields.${index}.dtoFieldRelations.0.sequenceNo`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} className='w-20'>
                            <Input
                              {...field}
                              type='number'
                              min={1}
                              aria-invalid={fieldState.invalid}
                              onChange={event => {
                                setFormChanged(true);
                                field.onChange(Number(event.target.value));
                              }}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      {(watchedDtoFields?.[index]?.id ?? 0) > 0 && (
                        <DialogValidations dtoFieldId={watchedDtoFields![index].id} />
                      )}
                      <Button type='button' variant='destructive' onClick={() => handleRemove(index)}>
                        <TrashIcon color='red' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={8} className='text-center text-sm text-gray-500'>
                <Button type='button' size='sm' variant='ghost' onClick={handleAppend} className='my-1 bg-gray-700'>
                  <PlusCircleIcon className='mr-3' /> Add Field
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
          {formChanged && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <Button type='submit' form={`form-update-dto-fields-${props.dtoId}`} className='mt-3 float-right bg-green-500 hover:bg-green-600 text-white'>
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
