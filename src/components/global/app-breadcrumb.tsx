import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from '@/components/ui/breadcrumb';

type AppBreadcrumbProps = {
  links?: {
    href: string;
    label: string;
  }[];
  page: string;
};

export default function AppBreadcrumb({...props}: AppBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {props.links?.map((link, index) => (
          <>
            <BreadcrumbItem key={index}>
              <BreadcrumbLink href={link.href}>{link.label}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className='hidden md:block' />
          </>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{props.page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
