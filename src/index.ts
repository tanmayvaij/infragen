import { getGithubFiles } from "snapcube";
import { config } from "dotenv";
import { z } from "zod";
import DiaFlowAgent, { FileMemory } from "diaflow";

config();

const prompt = (structure: string) => `
YOU ARE A EXPERT TECH STACK ANALYZER AND DEVOPS ENGINEER

Generate a JSON object for project deployment.

The project has the following file structure: 
${structure}

The JSON object should have three properties:

 - id: A unique project identifier.

 - terraform: A single string containing a complete and production-ready Terraform configuration. 
   This configuration must provision the necessary AWS infrastructure to deploy the given project, 
   with all resources located in the Mumbai (ap-south-1) region.

 - cmds: An array of shell commands, in order, to fully build and deploy the project. 
   This should include all necessary steps such as dependency installation, a project-specific build process, 
   infrastructure provisioning, and file/asset synchronization with the provisioned cloud resources. 
`;

const DeploymentSchema = z.object({
  id: z.string().describe("A unique project identifier"),
  terraform: z.string(
    `A single string containing a complete and production-ready Terraform configuration. 
    This configuration must provision the necessary AWS infrastructure to deploy the given project, 
    with all resources located in the Mumbai (ap-south-1) region`
  ),
  cmds: z.array(
    z.string(`An array of shell commands, in order, to fully build and deploy the project. 
   This should include all necessary steps such as dependency installation, a project-specific build process, 
   infrastructure provisioning, and file/asset synchronization with the provisioned cloud resources. `)
  ),
});

const agent = new DiaFlowAgent({
  apiKey: process.env.LLM_API_KEY!,
  provider: "gemini",
  model: "gemini-2.0-flash",
  memory: new FileMemory(),
  responseJsonSchema: DeploymentSchema,
});

export const generateDeploymentPlan = async (repository: string) => {
  const projectStructure = (await getGithubFiles(repository, {
    structureOnly: true,
    token: process.env.GITHUB_ACCOUNT_TOKEN!,
  })) as string[];

  const response = await agent.run(prompt(projectStructure.toString()));

  console.log(response);
};
