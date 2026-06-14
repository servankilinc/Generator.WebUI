import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import axiosHelper from '@/lib/axios-helper';
import { fetchEntities } from '@/redux/reducers/entitySlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch, PencilIcon, PlusCircleIcon, SaveIcon, TrashIcon, XIcon } from 'lucide-react';
import type Entity from '@/models/entity/entity';
import type FieldModel from '@/models/field/field';
import { RelationCreateSchema } from '@/models/relation/relationCreateDto';
import type RelationDetailModel from '@/models/relation/relationDetailModel';
import type RelationType from '@/models/relationType/relationType';
import type DeleteBehaviorType from '@/models/deleteBehaviorType/deleteBehaviorType';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';

const formSchema = RelationCreateSchema.extend({
  id: z.number().optional()
});

type RelationFormData = z.infer<typeof formSchema>;
type FormMode = 'create' | 'update';

export default function DialogRelations({ entityId }: { entityId: number }) {
  const dispatch = useAppDispatch();
  const entities = useAppSelector(state => state.entity.entities);

  const [isOpen, setIsOpen] = useState(false);
  const [relations, setRelations] = useState<RelationDetailModel[]>([]);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
  const [deleteBehaviorTypes, setDeleteBehaviorTypes] = useState<DeleteBehaviorType[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<number, FieldModel[]>>({});
  const [formMode, setFormMode] = useState<FormMode>('create');

  const defaultValues = useMemo(() => ({
    primaryEntityId: entityId,
    primaryFieldId: 0,
    foreignEntityId: 0,
    foreignFieldId: 0,
    primaryEntityVirPropName: '',
    foreignEntityVirPropName: '',
    relationTypeId: 0,
    deleteBehaviorTypeId: 0
  }), [entityId]);

  const form = useForm<RelationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const primaryEntityId = useWatch({ control: form.control, name: 'primaryEntityId' });
  const foreignEntityId = useWatch({ control: form.control, name: 'foreignEntityId' });

  const primaryFields = fieldMap[primaryEntityId] ?? [];
  const foreignFields = fieldMap[foreignEntityId] ?? [];

  const entityFields = useMemo(() => entities.flatMap(entity => entity.fields ?? []), [entities]);

  const getEntityName = (sourceEntityId: number) => entities.find(entity => entity.id === sourceEntityId)?.name ?? '';
  const getRelationTypeName = (relationTypeId: number) => relationTypes.find(type => type.id === relationTypeId)?.name ?? '';
  const getDeleteBehaviorTypeName = (deleteBehaviorTypeId: number) => deleteBehaviorTypes.find(type => type.id === deleteBehaviorTypeId)?.name ?? '';

  const getFieldEntityId = useCallback(
    (fieldId: number) => entityFields.find(field => field.id === fieldId)?.entityId ?? 0,
    [entityFields]
  );

  const getFieldEntityName = useCallback(
    (fieldId: number) => {
      const entId = getFieldEntityId(fieldId);
      return entities.find(entity => entity.id === entId)?.name ?? '';
    },
    [entities, getFieldEntityId]
  );

  const fetchRelations = useCallback(async () => {
    try {
      const response = await axiosHelper.get<RelationDetailModel[]>('/relation/list/byEntity', { params: { entityId } });
      setRelations(response ?? []);
    } catch (error) {
      toast.error('Relations Could not Readed!');
    }
  }, [entityId]);

  const fetchRelationTypes = async () => {
    try {
      const response = await axiosHelper.get<RelationType[]>('/relationType/list');
      setRelationTypes(response ?? []);
    } catch (error) {
      toast.error('Relation Types Could not Readed!');
    }
  };

  const fetchDeleteBehaviorTypes = async () => {
    try {
      const response = await axiosHelper.get<DeleteBehaviorType[]>('/deleteBehaviorType/list');
      setDeleteBehaviorTypes(response ?? []);
    } catch (error) {
      toast.error('Delete Behavior Types Could not Readed!');
    }
  };

  const fetchFieldsByEntity = useCallback(
    async (sourceEntityId: number) => {
      if (sourceEntityId === 0 || fieldMap[sourceEntityId] != null) {
        return;
      }

      try {
        const response = await axiosHelper.get<FieldModel[]>('/field/list/byEntity', { params: { entityId: sourceEntityId } });
        setFieldMap(current => ({ ...current, [sourceEntityId]: response ?? [] }));
      } catch (error) {
        toast.error('Fields Could not Readed!');
      }
    },
    [fieldMap]
  );

  const fetchFieldsForEntityDirect = async (sourceEntityId: number) => {
    if (sourceEntityId === 0) return;
    try {
      const response = await axiosHelper.get<FieldModel[]>('/field/list/byEntity', { params: { entityId: sourceEntityId } });
      setFieldMap(current => ({ ...current, [sourceEntityId]: response ?? [] }));
    } catch (error) {
      toast.error('Fields Could not Readed!');
    }
  };

  const resetCreateForm = useCallback(() => {
    setFormMode('create');
    form.reset(defaultValues);
    fetchFieldsByEntity(entityId);
  }, [entityId, fetchFieldsByEntity, form, defaultValues]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchRelations();
    fetchRelationTypes();
    fetchDeleteBehaviorTypes();
    fetchFieldsByEntity(entityId);

    if (entities.length === 0) {
      dispatch(fetchEntities());
    }
  }, [dispatch, entities.length, entityId, fetchFieldsByEntity, fetchRelations, isOpen]);

  const handlePrimaryEntityChange = (selectedEntityId: number) => {
    form.setValue('primaryEntityId', selectedEntityId, { shouldValidate: true });
    form.setValue('primaryFieldId', 0, { shouldValidate: true });
    fetchFieldsForEntityDirect(selectedEntityId);
  };

  const handleForeignEntityChange = (selectedEntityId: number) => {
    form.setValue('foreignEntityId', selectedEntityId, { shouldValidate: true });
    form.setValue('foreignFieldId', 0, { shouldValidate: true });
    fetchFieldsForEntityDirect(selectedEntityId);
  };

  const handleEdit = async (relation: RelationDetailModel) => {
    const nextPrimaryEntityId = getFieldEntityId(relation.primaryFieldId);
    const nextForeignEntityId = getFieldEntityId(relation.foreignFieldId);

    setFormMode('update');

    if (nextPrimaryEntityId > 0) await fetchFieldsForEntityDirect(nextPrimaryEntityId);
    if (nextForeignEntityId > 0) await fetchFieldsForEntityDirect(nextForeignEntityId);

    form.reset({
      ...relation,
      primaryEntityId: nextPrimaryEntityId,
      foreignEntityId: nextForeignEntityId,
      primaryEntityVirPropName: relation.primaryEntityVirPropName ?? '',
      foreignEntityVirPropName: relation.foreignEntityVirPropName ?? ''
    });
  };

  const handleDelete = async (relationId: number) => {
    try {
      await axiosHelper.delete('/relation', undefined, { params: { relationId } });
      toast.success('Relation Deleted Successfully');
      await fetchRelations();
      if (form.getValues('id') === relationId) {
        resetCreateForm();
      }
    } catch (error) {
      toast.error('Relation Could not Be Deleted!');
    }
  };

  async function onSubmit(data: RelationFormData) {
    const payload = {
      ...data,
      primaryEntityVirPropName: data.primaryEntityVirPropName || null,
      foreignEntityVirPropName: data.foreignEntityVirPropName || null
    };

    try {
      if (formMode === 'update') {
        await axiosHelper.put('/relation', payload);
        toast.success('Relation Updated Successfully');
      } else {
        await axiosHelper.post('/relation', payload);
        toast.success('Relation Created Successfully');
      }

      await fetchRelations();
      resetCreateForm();
    } catch (error) {
      toast.error(formMode === 'update' ? 'Relation Could not Be Updated!' : 'Relation Could not Be Created!');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='bg-sky-700' size='sm'>
          <GitBranch className='size-4 mr-2' /> Relations
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Relations for {getEntityName(entityId)}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Primary Field</TableHead>
                <TableHead>Foreign Field</TableHead>
                <TableHead>Relation Type</TableHead>
                <TableHead>Delete Behavior</TableHead>
                <TableHead>Virtual Field</TableHead>
                <TableHead>Virtual Property</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relations.length > 0 ? (
                relations.map(relation => (
                  <TableRow key={relation.id}>
                    <TableCell className='font-medium'>
                      {getFieldEntityName(relation.primaryFieldId) ? (
                        <span className='text-muted-foreground'>
                          {getFieldEntityName(relation.primaryFieldId)}.
                          <span className='text-foreground font-semibold'>{relation.primaryFieldName}</span>
                        </span>
                      ) : (
                        relation.primaryFieldName ?? '-'
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {getFieldEntityName(relation.foreignFieldId) ? (
                        <span className='text-muted-foreground'>
                          {getFieldEntityName(relation.foreignFieldId)}.
                          <span className='text-foreground font-semibold'>{relation.foreignFieldName}</span>
                        </span>
                      ) : (
                        relation.foreignFieldName ?? '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex items-center rounded-md bg-sky-400/10 px-2 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-400/20'>
                        {relation.relationTypeName ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex items-center rounded-md bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-400/20'>
                        {relation.deleteBehaviorTypeName ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>{relation.primaryEntityVirPropName ?? '-'}</TableCell>
                    <TableCell>{relation.foreignEntityVirPropName ?? '-'}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button type='button' variant='outline' size='icon-sm' onClick={() => handleEdit(relation)}>
                          <PencilIcon className='size-4' />
                        </Button>
                        <Button type='button' variant='destructive' size='icon-sm' onClick={() => handleDelete(relation.id)}>
                          <TrashIcon className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className='py-6 text-center text-muted-foreground'>
                    No relations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Separator />

          <form id={`form-relation-${entityId}`} onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-lg'>{formMode === 'update' ? 'Edit Relation' : 'Create Relation'}</h3>
              {formMode === 'update' && (
                <Button type='button' variant='outline' size='sm' onClick={resetCreateForm}>
                  <XIcon className='mr-2 size-4' /> Cancel Edit
                </Button>
              )}
            </div>

            <FieldGroup className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Primary Key side */}
              <div className='space-y-4 rounded-lg border border-border p-4 bg-card shadow-xs'>
                <h4 className='border-b border-border pb-2 font-bold text-sky-500 flex items-center gap-2'>
                  <GitBranch className='size-4' /> Primary Key
                </h4>

                <Controller
                  name='primaryEntityId'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Entity</FieldLabel>
                      <Combobox
                        items={entities}
                        value={entities.find(e => e.id === field.value)?.name ?? ''}
                        onValueChange={value => {
                          const selected = entities.find(entity => entity.name === value);
                          if (selected) {
                            handlePrimaryEntityChange(selected.id);
                          }
                        }}
                        aria-invalid={fieldState.invalid}>
                        <ComboboxInput placeholder='Select primary entity' />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: Entity) => (
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
                  name='primaryFieldId'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Field</FieldLabel>
                      <Combobox
                        items={primaryFields}
                        value={primaryFields.find(item => item.id === field.value)?.name ?? ''}
                        onValueChange={value => {
                          const selected = primaryFields.find(item => item.name === value);
                          if (selected) {
                            field.onChange(selected.id);
                          }
                        }}
                        aria-invalid={fieldState.invalid}>
                        <ComboboxInput disabled={primaryEntityId === 0} placeholder='Select primary field' />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: FieldModel) => (
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
                  name='primaryEntityVirPropName'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Virtual Field Name</FieldLabel>
                      <Input {...field} value={field.value ?? ''} placeholder='e.g., VirtualFieldName' autoComplete='off' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              {/* Foreign Key side */}
              <div className='space-y-4 rounded-lg border border-border p-4 bg-card shadow-xs'>
                <h4 className='border-b border-border pb-2 font-bold text-sky-500 flex items-center gap-2'>
                  <GitBranch className='rotate-180 size-4' /> Foreign Key
                </h4>

                <Controller
                  name='foreignEntityId'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Entity</FieldLabel>
                      <Combobox
                        items={entities}
                        value={entities.find(e => e.id === field.value)?.name ?? ''}
                        onValueChange={value => {
                          const selected = entities.find(entity => entity.name === value);
                          if (selected) {
                            handleForeignEntityChange(selected.id);
                          }
                        }}
                        aria-invalid={fieldState.invalid}>
                        <ComboboxInput placeholder='Select foreign entity' />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: Entity) => (
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
                  name='foreignFieldId'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Field</FieldLabel>
                      <Combobox
                        items={foreignFields}
                        value={foreignFields.find(item => item.id === field.value)?.name ?? ''}
                        onValueChange={value => {
                          const selected = foreignFields.find(item => item.name === value);
                          if (selected) {
                            field.onChange(selected.id);
                          }
                        }}
                        aria-invalid={fieldState.invalid}>
                        <ComboboxInput disabled={foreignEntityId === 0} placeholder='Select foreign field' />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item: FieldModel) => (
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
                  name='foreignEntityVirPropName'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Virtual Property Name</FieldLabel>
                      <Input {...field} value={field.value ?? ''} placeholder='e.g., VirtualPropName' autoComplete='off' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>

            <FieldGroup className='grid grid-cols-1 gap-6 md:grid-cols-2 rounded-lg border border-border p-4 bg-muted/40 shadow-xs'>
              <Controller
                name='relationTypeId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Relation Type</FieldLabel>
                    <Combobox
                      items={relationTypes}
                      value={getRelationTypeName(field.value)}
                      onValueChange={value => {
                        const selected = relationTypes.find(item => item.name === value);
                        if (selected) {
                          field.onChange(selected.id);
                        }
                      }}
                      aria-invalid={fieldState.invalid}>
                      <ComboboxInput placeholder='Select relation type' />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: RelationType) => (
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
                name='deleteBehaviorTypeId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Delete Behavior Type</FieldLabel>
                    <Combobox
                      items={deleteBehaviorTypes}
                      value={getDeleteBehaviorTypeName(field.value)}
                      onValueChange={value => {
                        const selected = deleteBehaviorTypes.find(item => item.name === value);
                        if (selected) {
                          field.onChange(selected.id);
                        }
                      }}
                      aria-invalid={fieldState.invalid}>
                      <ComboboxInput placeholder='Select delete behavior type' />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: DeleteBehaviorType) => (
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
          <Button type='submit' form={`form-relation-${entityId}`} className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            {formMode === 'update' ? <SaveIcon className='mr-2 size-4' /> : <PlusCircleIcon className='mr-2 size-4' />}
            {formMode === 'update' ? 'Save Relation' : 'Add Relation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
