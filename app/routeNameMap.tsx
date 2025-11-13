type RouteParams = {
  id: string | number;
};

export const routeNameMap = {
  "": "Home",
  projects: "Projects",
  "projects/list": "Project List",
  "projects/:id": (params: RouteParams) => `Project ${params.id}`,
  lead: "Lead",
};
