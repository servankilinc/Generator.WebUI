import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import axiosHelper from '@/lib/axios-helper';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { PlusCircleIcon, TrashIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import type CrudType from '@/models/crudType/crudType';
import { DtoCreateSchema } from '@/models/dto/dtoCreateDto';
import type RelationVisualModel from '@/models/dtoFieldRelations/relationVisualModel';
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

type FormData = z.infer<typeof DtoCreateSchema>;
type DtoFieldRowState = {
  relationOptions: RelationVisualModel[];
};

export default function DialogNewDto(props: { entityId: number; onCreated?: () => void }) {
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

  const entities = useAppSelector(state => state.entity.entities);
  const [crudTypes, setCrudTypes] = useState<CrudType[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, DtoFieldRowState>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(DtoCreateSchema),
    defaultValues: {
      name: '',
      relatedEntityId: props.entityId,
      crudTypeId: 0,
      dtoFields: []
    }
  });

  const dtoFields = useWatch({
    control: form.control,
    name: 'dtoFields'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dtoFields'
  });

  const getEntityFields = (sourceEntityId: number) => entities.find(entity => entity.id === sourceEntityId)?.fields ?? [];

  async function fetchCrudTypes() {
    try {
      const response = await axiosHelper.get<CrudType[]>('/crudType/list');
      setCrudTypes(response ?? []);
    } catch {
      toast.error('Crud Types Could not Readed!');
    }
  }

  async function syncDtoFieldRelations(rowId: string, index: number, sourceEntityId: number, dtoRelatedEntityId: number) {
    setRowStates(current => ({
      ...current,
      [rowId]: {
        relationOptions: []
      }
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
      setRowStates(current => ({
        ...current,
        [rowId]: {
          relationOptions
        }
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCrudTypes();
  }, []);

  useEffect(() => {
    if (isOpen && entities.length === 0) {
      dispatch(fetchEntities());
    }
  }, [dispatch, entities.length, isOpen]);

  useEffect(() => {
    fields.forEach((field, index) => {
      const sourceEntityId = dtoFields?.[index]?.sourceEntityId ?? 0;
      if (sourceEntityId !== 0) {
        syncDtoFieldRelations(field.id, index, sourceEntityId, props.entityId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.entityId]);

  async function onSubmit(data: FormData) {
    try {
      await axiosHelper.post('/dto', { ...data, relatedEntityId: props.entityId });
      toast.success('DTO Created Successfuly');
      setIsOpen(false);
      form.reset();
      setRowStates({});
      props.onCreated?.();
    } catch {
      toast.error('DTO Could not Bee Created!');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant='destructive' className='w-min m-3'>
          <PlusCircleIcon className='mx-2' /> New DTO
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Create New DTO</DialogTitle>
          <DialogDescription>Create DTO and define source fields.</DialogDescription>
        </DialogHeader>
        <form id='form-create-dto' onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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

          <Separator />

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>DTO Fields</h3>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  append({
                    dtoId: 0,
                    sourceEntityId: 0,
                    sourceFieldId: 0,
                    name: '',
                    isRequired: false,
                    isList: false,
                    dtoFieldRelations: null
                  })
                }>
                <PlusCircleIcon className='mr-3' />
                Add Field
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Entity</TableHead>
                  <TableHead>Source Field</TableHead>
                  <TableHead className='w-[180px]'>Name</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Rel. Sequence</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((item, index) => (
                  <TableRow key={item.id}>
                    {(() => {
                      const sourceEntityId = dtoFields?.[index]?.sourceEntityId ?? 0;
                      const sourceEntityFields = getEntityFields(sourceEntityId);
                      const relationOptions = rowStates[item.id]?.relationOptions ?? [];
                      const hasRelation = sourceEntityId !== 0 && props.entityId !== 0 && sourceEntityId !== props.entityId;

                      return (
                        <>
                          <TableCell className='font-medium'>
                            <Controller
                              name={`dtoFields.${index}.sourceEntityId`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <Combobox
                                    items={entities}
                                    value={entities.find(x => x.id === field.value)?.name ?? ''}
                                    onValueChange={value => {
                                      const selected = entities.find(x => x.name === value);
                                      const selectedEntityId = selected?.id ?? 0;
                                      field.onChange(selectedEntityId);
                                      form.setValue(`dtoFields.${index}.sourceFieldId`, 0, { shouldValidate: true });
                                      form.setValue(`dtoFields.${index}.name`, '', { shouldValidate: true });
                                      form.setValue(`dtoFields.${index}.isRequired`, false);
                                      form.setValue(`dtoFields.${index}.isList`, false);
                                      syncDtoFieldRelations(item.id, index, selectedEntityId, props.entityId);
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
                                <Field data-invalid={fieldState.invalid}>
                                  <Combobox
                                    items={sourceEntityFields}
                                    value={sourceEntityFields.find(x => x.id === field.value)?.name ?? ''}
                                    onValueChange={value => {
                                      const selected = sourceEntityFields.find(x => x.name === value);
                                      if (selected) {
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
                            <Controller
                              name={`dtoFields.${index}.name`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <Input {...field} aria-invalid={fieldState.invalid} placeholder='dto field name' autoComplete='off' />
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
                                  <Field data-invalid={fieldState.invalid}>
                                    <Combobox
                                      items={relationOptions}
                                      value={relationOptions.find(x => x.id === field.value)?.name ?? ''}
                                      onValueChange={value => {
                                        const selected = relationOptions.find(x => x.name === value);
                                        if (selected) {
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
                                  <Field data-invalid={fieldState.invalid}>
                                    <Input
                                      {...field}
                                      type='number'
                                      min={1}
                                      aria-invalid={fieldState.invalid}
                                      onChange={event => field.onChange(Number(event.target.value))}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                  </Field>
                                )}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button
                              type='button'
                              variant='destructive'
                              onClick={() => {
                                remove(index);
                                setRowStates(current => {
                                  const next = { ...current };
                                  delete next[item.id];
                                  return next;
                                });
                              }}>
                              <TrashIcon color='red' />
                            </Button>
                          </TableCell>
                        </>
                      );
                    })()}
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
          <Button type='submit' form='form-create-dto'>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
