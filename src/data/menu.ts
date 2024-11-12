// src/data/menuData.ts
const menuData = {
    id: "group-dashboard",
    title: "dashboard",
    type: "group",
    icon: "dashboard",
    children: [
      {
        id: "dashboard",
        title: "dashboard",
        type: "collapse",
        icon: "dashboard",
        children: [
          {
            id: "default",
            title: "default",
            type: "item",
            url: "/dashboard/default",
            breadcrumbs: false,
          },
          {
            id: "analytics",
            title: "analytics",
            type: "item",
            url: "/dashboard/analytics",
            breadcrumbs: false,
          },
        ],
      },
    ],
  };
  
  export default menuData;
  