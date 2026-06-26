import {
  EllipsisHorizontal,
  InformationCircleSolid,
  Photo,
  QueueList,
  StackPerspective,
  ThumbnailBadge,
  Trash,
  XMark,
} from "@medusajs/icons";
import { ListBadge } from "@mercurjs/dashboard-shared";
import { DropdownMenu, IconButton, Text, Tooltip, clx } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { FileType, FileUpload } from "@components/common/file-upload";
import { formatFileSize } from "@lib/format-file-size";
import { COLLECTION_IMAGE_FORMATS, CollectionMediaItem } from "./types";

type CollectionMediaInputProps = {
  value: CollectionMediaItem[];
  onChange: (next: CollectionMediaItem[]) => void;
  hasError?: boolean;
};

export const CollectionMediaInput = ({
  value,
  onChange,
  hasError,
}: CollectionMediaInputProps) => {
  const { t } = useTranslation();

  const handleUploaded = (files: FileType[]) => {
    onChange([
      ...value,
      ...files.map((f) => ({
        url: f.url,
        file: f.file,
        is_thumbnail: false,
        is_banner: false,
        field_id: f.id,
      })),
    ]);
  };

  // A flag (thumbnail/banner) is exclusive across the gallery: turning it
  // on for one image clears it from every other.
  const toggleRole = (
    index: number,
    role: "is_thumbnail" | "is_banner",
    on: boolean,
  ) => {
    onChange(
      value.map((item, i) => ({
        ...item,
        [role]: i === index ? on : on ? false : item[role],
      })),
    );
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-y-2" data-testid="collection-media-input">
      <FileUpload
        label={t("collections.media.upload.title")}
        hint={t("collections.media.upload.hint")}
        formats={COLLECTION_IMAGE_FORMATS}
        hasError={hasError}
        onUploaded={handleUploaded}
      />
      {value.length > 0 && (
        <ul
          className="flex flex-col gap-y-2"
          data-testid="collection-media-input-list"
        >
          {value.map((item, index) => (
            <li
              key={item.field_id ?? `${item.url}-${index}`}
              className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2"
              data-testid={`collection-media-input-item-${index}`}
            >
              <div className="flex items-center gap-x-3">
                <div className="bg-ui-bg-base flex h-10 w-[30px] items-center justify-center overflow-hidden rounded-md">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt=""
                      className="size-full object-cover object-center"
                    />
                  ) : (
                    <Photo className="text-ui-fg-muted" />
                  )}
                </div>
                <div className="flex flex-col">
                  <Text size="small" leading="compact">
                    {item.file?.name ?? item.url}
                  </Text>
                  <div className="text-ui-fg-subtle flex items-center gap-x-1">
                    {item.is_thumbnail && (
                      <Tooltip content={t("collections.media.thumbnail")}>
                        <ThumbnailBadge data-testid="collection-media-input-item-thumbnail-badge" />
                      </Tooltip>
                    )}
                    {item.is_banner && (
                      <Tooltip content={t("collections.media.banner")}>
                        <ListBadge data-testid="collection-media-input-item-banner-badge" />
                      </Tooltip>
                    )}
                    {item.file && (
                      <Text
                        size="xsmall"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        {formatFileSize(item.file.size)}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-x-1">
                <CollectionMediaItemMenu
                  item={item}
                  onToggleThumbnail={() =>
                    toggleRole(index, "is_thumbnail", !item.is_thumbnail)
                  }
                  onToggleBanner={() =>
                    toggleRole(index, "is_banner", !item.is_banner)
                  }
                  onDelete={() => remove(index)}
                  testId={`collection-media-input-item-menu-${index}`}
                />
                <IconButton
                  type="button"
                  size="small"
                  variant="transparent"
                  onClick={() => remove(index)}
                  data-testid={`collection-media-input-item-delete-${index}`}
                >
                  <XMark />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type CollectionMediaItemMenuProps = {
  item: CollectionMediaItem;
  onToggleThumbnail: () => void;
  onToggleBanner: () => void;
  onDelete: () => void;
  testId?: string;
};

const CollectionMediaItemMenu = ({
  item,
  onToggleThumbnail,
  onToggleBanner,
  onDelete,
  testId,
}: CollectionMediaItemMenuProps) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="small" variant="transparent" data-testid={testId}>
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <MenuItemWithTooltip
          icon={<StackPerspective />}
          label={
            item.is_thumbnail
              ? t("collections.media.actions.removeThumbnail")
              : t("collections.media.actions.setThumbnail")
          }
          tooltip={t("collections.media.tooltips.thumbnail")}
          onClick={onToggleThumbnail}
        />
        <MenuItemWithTooltip
          icon={<QueueList />}
          label={
            item.is_banner
              ? t("collections.media.actions.removeBanner")
              : t("collections.media.actions.setBanner")
          }
          tooltip={t("collections.media.tooltips.banner")}
          onClick={onToggleBanner}
        />
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          className="[&_svg]:text-ui-fg-subtle flex items-center gap-x-2"
          onClick={onDelete}
        >
          <Trash />
          <span>{t("actions.delete")}</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

const MenuItemWithTooltip = ({
  icon,
  label,
  tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
}) => {
  return (
    <DropdownMenu.Item
      className={clx(
        "[&_svg]:text-ui-fg-subtle flex items-center gap-x-2",
        "justify-between",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <span>{label}</span>
      </div>
      <Tooltip content={tooltip}>
        <InformationCircleSolid className="text-ui-fg-muted" />
      </Tooltip>
    </DropdownMenu.Item>
  );
};
