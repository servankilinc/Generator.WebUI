export default interface RelationDetailModel {
  id: number;
  primaryFieldId: number;
  primaryFieldName: string | null;
  foreignFieldId: number;
  foreignFieldName: string | null;
  relationTypeId: number;
  relationTypeName: string | null;
  deleteBehaviorTypeId: number;
  deleteBehaviorTypeName: string | null;
  primaryEntityVirPropName: string | null;
  foreignEntityVirPropName: string | null;
}
