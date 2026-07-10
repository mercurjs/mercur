import { Brand } from '@/types/brands';
import { BrandCard } from '@/components/organisms';
import { Carousel } from '@/components/cells';

const brands: Brand[] = [
  {
    id: 1,
    name: 'Balenciaga',
    logo: '/images/brands/Balenciaga.svg',
    href: '#',
  },
  {
    id: 2,
    name: 'Nike',
    logo: '/images/brands/Nike.svg',
    href: '#',
  },
  {
    id: 3,
    name: 'Prada',
    logo: '/images/brands/Prada.svg',
    href: '#',
  },
  {
    id: 4,
    name: 'Miu Miu',
    logo: '/images/brands/Miu-Miu.svg',
    href: '#',
  },
];

export function HomePopularBrandsSection() {
  return (
    <section className='bg-action px-4 py-8 md:px-6 lg:px-8 w-full'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='heading-lg text-tertiary'>
          POPULAR BRANDS
        </h2>
      </div>
      <Carousel
        variant='dark'
        items={brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      />
    </section>
  );
}
