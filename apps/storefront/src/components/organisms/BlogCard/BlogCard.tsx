import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { BlogPost } from "@/types/blog"
import { ArrowRightIcon } from "@/icons"
import tailwindConfig from "../../../../tailwind.config"
import { cn } from "@/lib/utils"

interface BlogCardProps {
  post: BlogPost
  index: number
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <LocalizedClientLink
      href={post.href}
      className={cn(
        "group block border border-secondary p-1 rounded-sm relative",
        index > 0 && "hidden lg:block"
      )}
    >
      <div className="relative overflow-hidden rounded-xs h-full">
        <Image
          loading="lazy"
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={decodeURIComponent(post.image)}
          alt={post.title}
          width={467}
          height={472}
          className="object-cover max-h-[472px] h-full w-full"
        />
      </div>
      <div className="p-4 bg-tertiary text-tertiary absolute bottom-0 left-1 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-b-xs w-[calc(100%-8px)]">
        <h3 className="heading-sm">{post.title}</h3>
        <p className="text-md line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-4 uppercase label-md mt-[26px]">
          Read more{" "}
          <ArrowRightIcon
            size={20}
            color={tailwindConfig.theme.extend.colors.tertiary}
          />
        </div>
      </div>
    </LocalizedClientLink>
  )
}
