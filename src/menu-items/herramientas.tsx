import React from "react";
import { FormattedMessage } from "react-intl";
import { Box, ClipboardText, Setting2 } from "iconsax-react";
import { NavItemType } from "types/menu";

const icons = {
  herramientas: Setting2,
  postalTracking: Box,
  plantillas: ClipboardText,
};

const herramientas: NavItemType = {
  id: "group-herramientas",
  title: <FormattedMessage id="Herramientas" />,
  icon: icons.herramientas,
  type: "group",
  children: [
    {
      id: "postal-tracking",
      title: <FormattedMessage id="Seguimiento de envíos" />,
      type: "item",
      icon: icons.postalTracking,
      url: "/herramientas/seguimiento-postal",
    },
    {
      id: "plantillas",
      title: <FormattedMessage id="Plantillas" />,
      type: "item",
      icon: icons.plantillas,
      url: "/herramientas/plantillas",
    },
  ],
};

export default herramientas;
