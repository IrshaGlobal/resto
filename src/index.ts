#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  allSkills,
  restoSkill,
  restoReviewSkill,
  restoCommitSkill,
  restoCompressSkill,
  restoDocsSkill,
  restoDebugSkill,
  restoStatsSkill,
  restoBackendSkill,
  restoFrontendSkill,
  restoChatSkill,
  restoPlanSkill,
  restoVerifySkill,
  restoLearnSkill,
} from "./skills.js";

const server = new Server(
  {
    name: "resto-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
      tools: {},
    },
  }
);

// === PROMPTS ===
// Prompts are pre-defined templates users can invoke to change AI behavior

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: allSkills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      arguments:
        skill.name === "resto"
          ? [
              {
                name: "intensity",
                description: "Intensity level: lite, full, ultra, zen",
                required: false,
              },
            ]
          : undefined,
    })),
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const skill = allSkills.find((s) => s.name === request.params.name);
  if (!skill) {
    throw new Error("Unknown prompt: " + request.params.name);
  }

  let content = skill.content;

  // Inject intensity if provided for resto prompt
  if (skill.name === "resto" && request.params.arguments?.intensity) {
    content += "\n\nINTENSITY: " + request.params.arguments.intensity;
  }

  return {
    description: skill.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: content,
        },
      },
    ],
  };
});

// === TOOLS ===
// Tools are callable functions that perform actions

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "resto_review",
        description: "Review code/diff in ultra-compressed resto style. Returns concise one-line comments.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Code or diff to review",
            },
            context: {
              type: "string",
              description: "Optional additional context (file path, PR description, etc.)",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "resto_commit",
        description: "Generate a Git commit message in resto style from a diff.",
        inputSchema: {
          type: "object",
          properties: {
            diff: {
              type: "string",
              description: "Git diff or change description",
            },
            type: {
              type: "string",
              enum: ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
              description: "Optional commit type",
            },
          },
          required: ["diff"],
        },
      },
      {
        name: "resto_compress",
        description: "Compress any text to resto style while preserving technical accuracy.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to compress",
            },
            intensity: {
              type: "string",
              enum: ["lite", "full", "ultra", "zen"],
              description: "Compression intensity level",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "resto_docs",
        description: "Write documentation in terse resto style.",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "What to document (API, function, feature, etc.)",
            },
            format: {
              type: "string",
              enum: ["readme", "inline", "api", "comment"],
              description: "Documentation format",
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "resto_debug",
        description: "Explain an error in minimal, actionable resto format.",
        inputSchema: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message or stack trace",
            },
            context: {
              type: "string",
              description: "Optional code context where error occurred",
            },
          },
          required: ["error"],
        },
      },
      {
        name: "resto_stats",
        description: "Analyze text and report token savings from resto compression.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to analyze for token savings",
            },
            intensity: {
              type: "string",
              enum: ["lite", "full", "ultra", "zen"],
              description: "Intensity level to estimate against",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "resto_backend",
        description: "Design backend architecture with world-class standards. Returns system design, DB schema, API structure, and infrastructure recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            requirements: {
              type: "string",
              description: "Project requirements, features, scale expectations",
            },
            stack: {
              type: "string",
              description: "Optional preferred tech stack or constraints",
            },
          },
          required: ["requirements"],
        },
      },
      {
        name: "resto_frontend",
        description: "Design frontend UI/UX with elite product standards. Returns design system, component architecture, and interaction patterns.",
        inputSchema: {
          type: "object",
          properties: {
            product: {
              type: "string",
              description: "Product description, target users, key features",
            },
            style: {
              type: "string",
              enum: ["minimalist", "maximalist", "enterprise", "consumer", "luxury"],
              description: "Design direction style",
            },
          },
          required: ["product"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "resto_review": {
        const code = request.params.arguments?.code as string;
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
          throw new Error("Invalid input: 'code' parameter is required and must be a non-empty string");
        }
        const context = (request.params.arguments?.context as string) || "";
        const reviewPrompt =
          restoReviewSkill.content +
          "\n\n=== CODE TO REVIEW ===\n" +
          (context ? "Context: " + context + "\n" : "") +
          code;
        return {
          content: [{ type: "text", text: reviewPrompt }],
        };
      }

      case "resto_commit": {
        const diff = request.params.arguments?.diff as string;
        if (!diff || typeof diff !== 'string' || diff.trim().length === 0) {
          throw new Error("Invalid input: 'diff' parameter is required and must be a non-empty string");
        }
        const commitType = (request.params.arguments?.type as string) || "";
        const validTypes = ["feat", "fix", "docs", "style", "refactor", "test", "chore"];
        if (commitType && !validTypes.includes(commitType)) {
          throw new Error(`Invalid commit type: '${commitType}'. Must be one of: ${validTypes.join(", ")}`);
        }
        const commitPrompt =
          restoCommitSkill.content +
          "\n\n=== DIFF ===\n" +
          diff +
          (commitType ? "\n\nPreferred type: " + commitType : "") +
          "\n\n=== YOUR TASK ===\nGenerate a resto-style commit message for this diff. One line only.";
        return {
          content: [{ type: "text", text: commitPrompt }],
        };
      }

      case "resto_compress": {
        const text = request.params.arguments?.text as string;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
          throw new Error("Invalid input: 'text' parameter is required and must be a non-empty string");
        }
        const intensity = (request.params.arguments?.intensity as string) || "full";
        const validIntensities = ["lite", "full", "ultra", "zen"];
        if (!validIntensities.includes(intensity)) {
          throw new Error(`Invalid intensity: '${intensity}'. Must be one of: ${validIntensities.join(", ")}`);
        }
        const compressPrompt =
          restoCompressSkill.content +
          "\n\nINTENSITY: " +
          intensity +
          "\n\n=== TEXT TO COMPRESS ===\n" +
          text +
          "\n\n=== YOUR TASK ===\nRewrite the above text in resto mode at the specified intensity. Maintain all technical accuracy.";
        return {
          content: [{ type: "text", text: compressPrompt }],
        };
      }

      case "resto_docs": {
        const topic = request.params.arguments?.topic as string;
        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
          throw new Error("Invalid input: 'topic' parameter is required and must be a non-empty string");
        }
        const format = (request.params.arguments?.format as string) || "inline";
        const validFormats = ["readme", "inline", "api", "comment"];
        if (!validFormats.includes(format)) {
          throw new Error(`Invalid format: '${format}'. Must be one of: ${validFormats.join(", ")}`);
        }
        const docsPrompt =
          restoDocsSkill.content +
          "\n\nFORMAT: " +
          format +
          "\n\n=== TOPIC ===\n" +
          topic +
          "\n\n=== YOUR TASK ===\nWrite documentation for the above topic in resto style.";
        return {
          content: [{ type: "text", text: docsPrompt }],
        };
      }

      case "resto_debug": {
        const error = request.params.arguments?.error as string;
        if (!error || typeof error !== 'string' || error.trim().length === 0) {
          throw new Error("Invalid input: 'error' parameter is required and must be a non-empty string");
        }
        const debugContext = (request.params.arguments?.context as string) || "";
        const debugPrompt =
          restoDebugSkill.content +
          "\n\n=== ERROR ===\n" +
          error +
          (debugContext ? "\n\n=== CODE CONTEXT ===\n" + debugContext : "") +
          "\n\n=== YOUR TASK ===\nExplain this error in resto debug format. What broke -> Why -> Fix.";
        return {
          content: [{ type: "text", text: debugPrompt }],
        };
      }

      case "resto_stats": {
        const statsText = request.params.arguments?.text as string;
        if (!statsText || typeof statsText !== 'string' || statsText.trim().length === 0) {
          throw new Error("Invalid input: 'text' parameter is required and must be a non-empty string");
        }
        const statsIntensity = (request.params.arguments?.intensity as string) || "full";
        const validIntensities = ["lite", "full", "ultra", "zen"];
        if (!validIntensities.includes(statsIntensity)) {
          throw new Error(`Invalid intensity: '${statsIntensity}'. Must be one of: ${validIntensities.join(", ")}`);
        }
        const statsPrompt =
          restoStatsSkill.content +
          "\n\nINTENSITY: " +
          statsIntensity +
          "\n\n=== TEXT TO ANALYZE ===\n" +
          statsText +
          "\n\n=== YOUR TASK ===\nReport token savings if this text were rewritten in resto mode.";
        return {
          content: [{ type: "text", text: statsPrompt }],
        };
      }

      case "resto_backend": {
        const requirements = request.params.arguments?.requirements as string;
        if (!requirements || typeof requirements !== 'string' || requirements.trim().length === 0) {
          throw new Error("Invalid input: 'requirements' parameter is required and must be a non-empty string");
        }
        const stack = (request.params.arguments?.stack as string) || "";
        const backendPrompt =
          restoBackendSkill.content +
          "\n\n=== PROJECT REQUIREMENTS ===\n" +
          requirements +
          (stack ? "\n\nPREFERRED STACK: " + stack : "") +
          "\n\n=== YOUR TASK ===\nDesign a complete backend architecture for this project. Include: database schema, API design, infrastructure recommendations, security considerations, and scalability strategy.";
        return {
          content: [{ type: "text", text: backendPrompt }],
        };
      }

      case "resto_frontend": {
        const product = request.params.arguments?.product as string;
        if (!product || typeof product !== 'string' || product.trim().length === 0) {
          throw new Error("Invalid input: 'product' parameter is required and must be a non-empty string");
        }
        const style = (request.params.arguments?.style as string) || "";
        const validStyles = ["minimalist", "maximalist", "enterprise", "consumer", "luxury"];
        if (style && !validStyles.includes(style)) {
          throw new Error(`Invalid style: '${style}'. Must be one of: ${validStyles.join(", ")}`);
        }
        const frontendPrompt =
          restoFrontendSkill.content +
          "\n\n=== PRODUCT DESCRIPTION ===\n" +
          product +
          (style ? "\n\nDESIGN DIRECTION: " + style : "") +
          "\n\n=== YOUR TASK ===\nDesign a complete frontend UI/UX system for this product. Include: design tokens, component architecture, layout structure, interaction patterns, and responsive strategy.";
        return {
          content: [{ type: "text", text: frontendPrompt }],
        };
      }

      default:
        throw new Error("Unknown tool: " + request.params.name);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// === START ===
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Resto MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
