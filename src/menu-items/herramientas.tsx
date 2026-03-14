import React from "react";
import { FormattedMessage } from "react-intl";
import { Box, Setting2 } from "iconsax-react";
import { NavItemType } from "types/menu";

const icons = {
  herramientas: Setting2,
  postalTracking: Box,
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
  ],
};

export default herramientas;
