import { BadgeInfo } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DialogUpdateDto from './dialog-update-dto';
import { Separator } from '@/components/ui/separator';
import TableDtoFields from './table-dtofields';
import type DtoDetailResponseDto from '@/models/dto/dtoDetailResponseDto';

export default function CardDto({ dto, onUpdated }: { dto: DtoDetailResponseDto; onUpdated?: () => void }) {
  return (
    <Card size='sm' className='mx-auto '>
      <CardHeader>
        <CardTitle className='flex justify-between'>
          <div className='flex gap-2'>
            <span className='font-bold text-xl'>{dto.name}</span>
            <BadgeInfo className='self-center' title='CRUD Type'>
              {dto.crudTypeName}
            </BadgeInfo>
          </div>
          <DialogUpdateDto dtoId={dto.id} onUpdated={onUpdated} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <TableDtoFields dtoId={dto.id} onUpdated={onUpdated} />
      </CardContent>
    </Card>
  );
}
