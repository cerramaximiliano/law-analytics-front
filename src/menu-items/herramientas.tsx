import React from "react";
import { FormattedMessage } from "react-intl";
import { Box, Briefcase, Setting2 } from "iconsax-react";
import { NavItemType } from "types/menu";

const icons = {
  herramientas: Setting2,
  postalTracking: Box,
  seclo: Briefcase,
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
      id: "seclo",
      title: <FormattedMessage id="Audiencias SECLO" />,
      type: "item",
      icon: icons.seclo,
      url: "/herramientas/seclo",
    },
  ],
};

export default herramientas;
