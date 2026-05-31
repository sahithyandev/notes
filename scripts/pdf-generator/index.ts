import { generateModulePdf } from "./core";

(async () => {
  const moduleId = "s1/mathematics";
  await generateModulePdf(moduleId);
})();
