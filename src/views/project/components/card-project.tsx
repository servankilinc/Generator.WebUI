import { useAppDispatch } from '@/hooks';
import axiosHelper from '@/lib/axios-helper';
import { setActiveProject } from '@/redux/reducers/projectSlice';
import type Project from '@/models/project/project';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CardProject(props: { project: Project }) {
  const dispatch = useAppDispatch();

  const selectProject = async () => {
    try {
      await axiosHelper.post<Project>('activeProject', undefined, { params: { id: props.project.id } });
      dispatch(setActiveProject(props.project));
    } catch (error) {
      toast.error('The Project Has not Been Selected!');
    }
  };

  return (
    <Card size='sm' className='mx-auto w-full max-w-sm'>
      <CardHeader>
        <CardTitle>{props.project.projectName}</CardTitle>
        <CardDescription>{props.project.createDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='aspect-video rounded-xl bg-muted/50' />
      </CardContent>
      <CardFooter>
        <Button variant='outline' size='sm' className='w-full' onClick={() => selectProject()}>
          Select
        </Button>
      </CardFooter>
    </Card>
  );
}
