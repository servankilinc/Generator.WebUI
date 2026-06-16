import { useAppDispatch } from '@/hooks';
import axiosHelper from '@/lib/axios-helper';
import { fetchProjects, setActiveProject } from '@/redux/reducers/projectSlice';
import type Project from '@/models/project/project';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function CardProject(props: { project: Project }) {
  const dispatch = useAppDispatch();

  const selectProject = async () => {
    try {
      await axiosHelper.post<Project>('/activeProject', undefined, { params: { id: props.project.id } });
      dispatch(setActiveProject(props.project));
    } catch (error) {
      toast.error('The Project Has not Been Selected!');
    }
  };

  const deleteProject = async () => {
    try {
      await axiosHelper.delete('/project', undefined, { params: { id: props.project.id } });
      toast.success('Project Deleted Successfully');
      dispatch(fetchProjects());
    } catch (error) {
      toast.error('Project Could not Be Deleted!');
    }
  };

  return (
    <Card size='sm' className='mx-auto w-full'>
      <CardHeader>
        <CardTitle>{props.project.projectName}</CardTitle>
        <CardDescription>{props.project.createDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='aspect-video rounded-xl bg-muted/50' />
      </CardContent>
      <CardFooter className='flex gap-2'>
        <Button variant='outline' size='sm' className='flex-1' onClick={() => selectProject()}>
          Select
        </Button>
        <Button variant='destructive' size='icon-sm' onClick={() => deleteProject()}>
          <TrashIcon className='size-4' />
        </Button>
      </CardFooter>
    </Card>
  );
}
