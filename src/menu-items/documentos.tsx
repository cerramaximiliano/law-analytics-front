import React from "react";
import { FormattedMessage } from "react-intl";
import { ClipboardText, DocumentText, FolderOpen } from "iconsax-react";
import { NavItemType } from "types/menu";

const icons = {
  documentos: FolderOpen,
  escritos: DocumentText,
  modelos: ClipboardText,
};

const documentos: NavItemType = {
  id: "group-documentos",
  title: <FormattedMessage id="Documentos" />,
  icon: icons.documentos,
  type: "group",
  children: [
    {
      id: "escritos",
      title: <FormattedMessage id="Escritos" />,
      type: "item",
      icon: icons.escritos,
      url: "/documentos/escritos",
    },
    {
      id: "modelos",
      title: <FormattedMessage id="Modelos" />,
      type: "item",
      icon: icons.modelos,
      url: "/documentos/modelos",
    },
  ],
};

export default documentos;
